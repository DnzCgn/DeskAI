const { Router } = require('express');
const Device = require('../models/Device');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isDeviceOnline, sendCommand } = require('../services/wsServer');

const router = Router();

router.get('/', requireAuth, requireRole('owner', 'company_admin', 'department_manager'), async (req, res) => {
  try {
    const filter = { organization: req.user.organization };

    if (req.query.status) filter.status = req.query.status;

    const devices = await Device.find(filter).sort({ lastSeen: -1 });

    const enriched = devices.map((d) => ({
      ...d.toObject(),
      online: isDeviceOnline(d.deviceId),
    }));

    res.json({ devices: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.post('/:deviceId/command', requireAuth, requireRole('owner', 'company_admin', 'department_manager'), async (req, res) => {
  try {
    const { command, payload } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const device = await Device.findOne({ deviceId: req.params.deviceId, organization: req.user.organization });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!isDeviceOnline(req.params.deviceId)) {
      return res.status(400).json({ error: 'Device is offline' });
    }

    const result = sendCommand(req.params.deviceId, command, payload || {});
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, deviceId: req.params.deviceId, command });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
