import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import useWebSocket from '../hooks/useWebSocket';
import FadeIn from '../components/FadeIn';
import RequireRole from '../components/RequireRole';

const COMMANDS = [
  { id: 'restart', label: 'Restart', icon: '🔄', confirm: 'Are you sure you want to restart this device?' },
  { id: 'shutdown', label: 'Shut Down', icon: '⏻', confirm: 'Are you sure you want to shut down this device?' },
  { id: 'update', label: 'Check Updates', icon: '📦' },
  { id: 'status', label: 'Request Status', icon: '📊' },
];

export default function Devices() {
  return (
    <RequireRole roles={['owner', 'company_admin', 'department_manager']}>
      <DevicesContent />
    </RequireRole>
  );
}

function DevicesContent() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [sending, setSending] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    loadDevices();
  }, [statusFilter]);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(e) {
      if (!e.target.closest('[data-menu]')) setOpenMenuId(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadDevices() {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await api.get('/devices', { params });
      setDevices(data.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendDeviceCommand(deviceId, command) {
    setSending(deviceId + command);
    setConfirmAction(null);
    setOpenMenuId(null);
    try {
      await api.post(`/devices/${deviceId}/command`, { command });
      setToast({ type: 'success', text: `Command "${command}" sent to device` });
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.error || 'Command failed' });
    } finally {
      setSending(null);
    }
  }

  function handleCommandClick(deviceId, cmd) {
    if (cmd.confirm) {
      setConfirmAction({ deviceId, cmd });
    } else {
      sendDeviceCommand(deviceId, cmd.id);
    }
  }

  const handleAdminConnected = useCallback((onlineDevices) => {
    setWsConnected(true);
    const onlineIds = new Set(onlineDevices.map((d) => d.deviceId));
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        online: onlineIds.has(d.deviceId) ? true : d.online,
      }))
    );
  }, []);

  const handleDeviceOnline = useCallback((payload) => {
    setDevices((prev) => {
      const exists = prev.some((d) => d.deviceId === payload.deviceId);
      if (exists) {
        return prev.map((d) =>
          d.deviceId === payload.deviceId
            ? { ...d, online: true, ipAddress: payload.ipAddress || d.ipAddress, lastSeen: payload.lastSeen || new Date().toISOString() }
            : d
        );
      }
      return [
        {
          deviceId: payload.deviceId,
          name: payload.name || payload.deviceId,
          online: true,
          ipAddress: payload.ipAddress || null,
          lastSeen: payload.lastSeen || new Date().toISOString(),
          status: 'online',
        },
        ...prev,
      ];
    });
  }, []);

  const handleDeviceOffline = useCallback((payload) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.deviceId === payload.deviceId
          ? { ...d, online: false, lastSeen: payload.lastSeen || new Date().toISOString() }
          : d
      )
    );
  }, []);

  const handleDisconnect = useCallback(() => {
    setWsConnected(false);
  }, []);

  useWebSocket({ onDeviceOnline: handleDeviceOnline, onDeviceOffline: handleDeviceOffline, onAdminConnected: handleAdminConnected, onDisconnect: handleDisconnect });

  const onlineCount = devices.filter((d) => d.online).length;
  const offlineCount = devices.filter((d) => !d.online).length;

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -12, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{confirmAction.cmd.icon}</span>
              <div>
                <h3 className="text-white font-semibold">{confirmAction.cmd.label}</h3>
                <p className="text-zinc-400 text-sm">{confirmAction.cmd.confirm}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendDeviceCommand(confirmAction.deviceId, confirmAction.cmd.id)}
                disabled={sending === confirmAction.deviceId + confirmAction.cmd.id}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                {sending === confirmAction.deviceId + confirmAction.cmd.id ? 'Sending...' : `Confirm ${confirmAction.cmd.label}`}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Devices</h2>
            <p className="text-zinc-400 mt-1">Desktop clients connected to your organization</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              {wsConnected ? 'Live' : 'Connecting...'}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} online
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                {offlineCount} offline
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex gap-2">
          {['', 'online', 'offline'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                statusFilter === s
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-800/30'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left">
                  <th className="px-6 py-4 text-zinc-400 font-medium">Device</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Status</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">IP Address</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Last Seen</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No devices registered yet
                    </td>
                  </tr>
                ) : (
                  devices.map((d, i) => (
                    <motion.tr
                      key={d.deviceId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors duration-300 ${d.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                            🖥
                          </div>
                          <div>
                            <p className="text-white font-medium">{d.name || d.deviceId}</p>
                            <p className="text-xs text-zinc-500 font-mono">{d.deviceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          key={d.deviceId + d.online}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${d.online ? 'text-emerald-400' : 'text-zinc-500'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${d.online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                          {d.online ? 'Online' : 'Offline'}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{d.ipAddress || '—'}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right relative" data-menu>
                        {d.online && (
                          <button
                            onClick={() => setOpenMenuId(openMenuId === d.deviceId ? null : d.deviceId)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                        )}

                        <AnimatePresence>
                          {openMenuId === d.deviceId && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-12 z-20 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
                            >
                              {COMMANDS.map((cmd) => (
                                <button
                                  key={cmd.id}
                                  disabled={sending === d.deviceId + cmd.id}
                                  onClick={() => handleCommandClick(d.deviceId, cmd)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white disabled:opacity-40 transition-colors text-left"
                                >
                                  <span className="text-base">{cmd.icon}</span>
                                  <span>{cmd.label}</span>
                                  {sending === d.deviceId + cmd.id && (
                                    <span className="ml-auto w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <h4 className="text-sm font-medium text-zinc-300">Remote commands</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Click the ••• menu on an online device to send remote commands like restart, shutdown, or status checks. Destructive commands require confirmation.
              </p>
            </div>
          </div>
        </motion.div>
      </FadeIn>
    </div>
  );
}
