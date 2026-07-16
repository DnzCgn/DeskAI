const mongoose = require('mongoose');

const policyTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  tonePreset: { type: String, enum: ['formal_concise', 'energetic_friendly', null], default: null },
}, { _id: true });

const brandingSchema = new mongoose.Schema({
  displayName: { type: String },
  shortName: { type: String },
  companyName: { type: String },
  supportEmail: { type: String },
  supportUrl: { type: String },
  iconPath: { type: String },
  trayIconPath: { type: String },
  splashPath: { type: String },
  widgetLogoPath: { type: String },
  lightWebLogoPath: { type: String },
  darkWebLogoPath: { type: String },
  faviconPath: { type: String },
  emailHeaderLogoPath: { type: String },
  defaultAssistantName: { type: String },
  defaultVoice: { type: String },
  defaultWakeSound: { type: String },
}, { _id: false });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },

  plan: {
    type: String,
    enum: ['personal_free', 'personal_pro', 'team', 'enterprise'],
    default: 'personal_free',
  },

  featureFlags: {
    learningMode: { type: Boolean, default: true },
    remoteControl: { type: Boolean, default: false },
    performanceAnalytics: { type: Boolean, default: false },
    policyTemplates: { type: Boolean, default: false },
    actionMarketplace: { type: Boolean, default: false },
    multiProfileMachines: { type: Boolean, default: false },
    complianceExport: { type: Boolean, default: false },
    customVoiceBranding: { type: Boolean, default: false },
    bringYourOwnApiKey: { type: Boolean, default: false },
    thirdPartyFunctionsEnabled: { type: Boolean, default: false },
    detailedActivityLogging: { type: Boolean, default: false },
    aiHttpRequestsEnabled: { type: Boolean, default: false },
    multiDeviceSync: { type: Boolean, default: false },
    hrModule: { type: Boolean, default: false },
    maxEmployees: { type: Number, default: 1 },
    maxStoredActions: { type: Number, default: 5 },
    retentionDays: { type: Number, default: 30 },
  },

  tokenQuotaStatus: {
    type: String,
    enum: ['healthy', 'low', 'exhausted'],
    default: 'healthy',
  },

  reasoningProvider: { type: String, default: 'deepseek_v4_flash' },
  speechProvider: { type: String, default: 'gemini' },
  secondaryReasoningProviders: { type: [String], default: [] },

  byoApiKeyEncrypted: { type: String, default: null },

  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },

  branding: { type: brandingSchema, default: () => ({}) },

  policyTemplates: { type: [policyTemplateSchema], default: [] },

  lockdownActive: { type: Boolean, default: false },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
