const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Unnamed Device' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  ipAddress: { type: String, default: null },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

deviceSchema.index({ user: 1 });
deviceSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('Device', deviceSchema);
