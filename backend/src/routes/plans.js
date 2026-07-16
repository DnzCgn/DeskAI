const { Router } = require('express');
const { PLAN_DEFAULTS } = require('../config/plans');

const FEATURE_LABELS = {
  learningMode: 'Learning mode',
  remoteControl: 'Remote control',
  performanceAnalytics: 'Performance analytics',
  policyTemplates: 'Policy templates',
  actionMarketplace: 'Action marketplace',
  multiProfileMachines: 'Multi-profile machines',
  complianceExport: 'Compliance exports',
  customVoiceBranding: 'Custom voice branding',
  bringYourOwnApiKey: 'BYO API key',
  thirdPartyFunctionsEnabled: 'Third-party functions',
  detailedActivityLogging: 'Detailed logging',
  aiHttpRequestsEnabled: 'AI HTTP requests',
  multiDeviceSync: 'Multi-device sync',
  hrModule: 'HR module',
  knowledgeBase: 'Knowledge base',
  personalConnectors: 'Personal connectors',
  analyticsExport: 'Analytics export',
  functionVersioning: 'Function versioning',
};

function planFeatures(flags) {
  const features = [];
  for (const [key, label] of Object.entries(FEATURE_LABELS)) {
    if (flags[key]) features.push(label);
  }
  if (flags.maxEmployees && flags.maxEmployees > 1) {
    features.push(`Up to ${flags.maxEmployees.toLocaleString()} employees`);
  } else if (flags.maxEmployees === 1) {
    features.push('1 employee');
  }
  features.push(`${flags.maxStoredActions >= 999999 ? 'Unlimited' : flags.maxStoredActions?.toLocaleString() || 'Unlimited'} stored actions`);
  features.push(`${flags.retentionDays}-day retention`);
  return features;
}

const PLANS = [
  { id: 'personal_free', name: 'Free', price: '$0', interval: 'forever', description: 'Personal AI assistant for individuals', color: 'zinc', highlight: false },
  { id: 'personal_pro', name: 'Pro', price: '$7.99', interval: '/month', description: 'Enhanced AI with multi-device support', color: 'emerald', highlight: true },
  { id: 'team', name: 'Team', price: '$14.99', interval: '/month', description: 'Collaborative AI for growing teams', color: 'blue', highlight: false },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', interval: '', description: 'Full-featured AI with dedicated support', color: 'purple', highlight: false },
];

const router = Router();

router.get('/', (_req, res) => {
  const plans = PLANS.map((plan) => {
    const flags = PLAN_DEFAULTS[plan.id] || PLAN_DEFAULTS.personal_free;
    return { ...plan, features: planFeatures(flags) };
  });
  res.json({ plans });
});

module.exports = router;
