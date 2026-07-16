const { WebSocketServer } = require('ws');
const { verifyToken } = require('./auth');
const User = require('../models/User');
const Device = require('../models/Device');

const connections = new Map();
const adminConnections = new Map();

function broadcastToOrgAdmins(orgId, message) {
  const raw = JSON.stringify(message);
  const clients = adminConnections.get(orgId);
  if (!clients) return;
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(raw);
  }
}

function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      const deviceId = url.searchParams.get('deviceId');

      if (!token) {
        ws.close(4001, 'Missing token');
        return;
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch {
        ws.close(4002, 'Invalid token');
        return;
      }

      const user = await User.findById(decoded.userId).select('-passwordHash -mfaSecret');
      if (!user || user.offboarded) {
        ws.close(4003, 'User not found or offboarded');
        return;
      }

      const orgId = user.organization?.toString() || null;

      if (!deviceId) {
        const allowedRoles = ['owner', 'company_admin', 'department_manager'];
        if (!allowedRoles.includes(user.role)) {
          ws.close(4003, 'Insufficient role');
          return;
        }

        ws._isAdmin = true;
        ws._orgId = orgId;
        ws._userId = user._id.toString();

        const key = orgId || user._id.toString();
        if (!adminConnections.has(key)) adminConnections.set(key, new Set());
        adminConnections.get(key).add(ws);

        const onlineList = [];
        for (const [id, client] of connections) {
          if (!orgId || client._orgId === orgId) {
            onlineList.push({ deviceId: id, userId: client._userId });
          }
        }

        ws.send(JSON.stringify({
          type: 'admin_connected',
          payload: { onlineDevices: onlineList },
        }));

        ws.on('close', () => {
          const set = adminConnections.get(key);
          if (set) {
            set.delete(ws);
            if (set.size === 0) adminConnections.delete(key);
          }
        });

        ws.on('error', (err) => console.error('ws admin error:', err.message));
        return;
      }

      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          deviceId,
          name: deviceId,
          user: user._id,
          organization: user.organization,
          status: 'online',
          ipAddress: req.socket.remoteAddress,
          lastSeen: new Date(),
        },
        { upsert: true, new: true },
      );

      ws._deviceId = deviceId;
      ws._userId = user._id.toString();
      ws._orgId = orgId;

      connections.set(deviceId, ws);

      broadcastToOrgAdmins(orgId, {
        type: 'device_online',
        payload: { deviceId, name: device.name, ipAddress: device.ipAddress, lastSeen: device.lastSeen },
      });

      ws.send(JSON.stringify({
        type: 'connected',
        payload: { deviceId, userId: user._id, device: device.toObject() },
      }));

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          handleIncoming(ws, msg);
        } catch {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
        }
      });

      ws.on('close', () => {
        connections.delete(deviceId);
        broadcastToOrgAdmins(orgId, {
          type: 'device_offline',
          payload: { deviceId, lastSeen: new Date().toISOString() },
        });
        Device.updateOne({ deviceId }, { status: 'offline', lastSeen: new Date() }).catch((err) => console.error('ws device update failed:', err.message));
      });

      ws.on('error', (err) => console.error('ws error:', err.message));
    } catch (err) {
      ws.close(4000, 'Internal server error');
    }
  });

  return wss;
}

function handleIncoming(ws, msg) {
  switch (msg.type) {
    case 'activity_log':
      break;
    case 'device_status':
      ws.send(JSON.stringify({ type: 'device_status_ack', payload: { received: true } }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', payload: { message: `Unknown message type: ${msg.type}` } }));
  }
}

function sendCommand(deviceId, command, payload = {}) {
  const ws = connections.get(deviceId);
  if (!ws) {
    return { success: false, error: 'Device not connected' };
  }
  ws.send(JSON.stringify({ type: 'command', command, payload }));
  return { success: true };
}

function getOnlineDevices(orgId = null) {
  const devices = [];
  for (const [id, ws] of connections) {
    if (!orgId || ws._orgId === orgId) {
      devices.push({ deviceId: id, userId: ws._userId, orgId: ws._orgId });
    }
  }
  return devices;
}

function isDeviceOnline(deviceId) {
  return connections.has(deviceId);
}

module.exports = { initWebSocket, sendCommand, getOnlineDevices, isDeviceOnline, broadcastToOrgAdmins };
