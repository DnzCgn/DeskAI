const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  lastActive: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },

  role: {
    type: String,
    enum: ['owner', 'company_admin', 'department_manager', 'team_lead', 'employee', 'auditor'],
    default: 'employee',
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  department: { type: String, default: null },

  assistantName: { type: String, default: null },
  assistantVoice: { type: String, default: null },
  wakePhrase: { type: String, default: null },
  languagePreference: { type: String, enum: ['en', 'tr'], default: 'en' },
  keyboardShortcut: { type: String, default: null },
  colorTheme: {
    type: String,
    enum: ['light_green_black', 'light_green_white', 'light_orange_black', 'light_orange_white'],
    default: 'light_green_black',
  },

  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: null },

  offboarded: { type: Boolean, default: false },

  sessions: { type: [sessionSchema], default: [] },

  permissionLevel: {
    type: String,
    enum: ['observe_only', 'suggest_confirm', 'trusted_automation'],
    default: 'observe_only',
  },

  mode: { type: String, enum: ['personal', 'enterprise'], default: 'personal' },

  policyOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },

  consentShown: { type: Boolean, default: false },

  setupToken: { type: String, default: null },

  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.index({ organization: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
