const PLAN_DEFAULTS = {
  personal_free: {
    learningMode: true,
    remoteControl: false,
    performanceAnalytics: false,
    policyTemplates: false,
    actionMarketplace: false,
    multiProfileMachines: false,
    complianceExport: false,
    customVoiceBranding: false,
    bringYourOwnApiKey: false,
    thirdPartyFunctionsEnabled: false,
    detailedActivityLogging: false,
    aiHttpRequestsEnabled: false,
    multiDeviceSync: false,
    hrModule: false,
    personalConnectors: false,
    analyticsExport: false,
    knowledgeBase: false,
    functionVersioning: false,
    maxEmployees: 1,
    maxStoredActions: 5,
    retentionDays: 30,
    availableReasoningProviders: ['deepseek_v4_flash'],
  },
  personal_pro: {
    learningMode: true,
    remoteControl: false,
    performanceAnalytics: false,
    policyTemplates: false,
    actionMarketplace: false,
    multiProfileMachines: false,
    complianceExport: false,
    customVoiceBranding: true,
    bringYourOwnApiKey: false,
    thirdPartyFunctionsEnabled: false,
    detailedActivityLogging: false,
    aiHttpRequestsEnabled: false,
    multiDeviceSync: true,
    hrModule: false,
    personalConnectors: true,
    analyticsExport: false,
    knowledgeBase: true,
    functionVersioning: false,
    maxEmployees: 1,
    maxStoredActions: 50,
    retentionDays: 90,
    availableReasoningProviders: ['deepseek_v4_flash'],
  },
  team: {
    learningMode: true,
    remoteControl: true,
    performanceAnalytics: true,
    policyTemplates: true,
    actionMarketplace: true,
    multiProfileMachines: false,
    complianceExport: false,
    customVoiceBranding: true,
    bringYourOwnApiKey: false,
    thirdPartyFunctionsEnabled: true,
    detailedActivityLogging: false,
    aiHttpRequestsEnabled: false,
    multiDeviceSync: true,
    hrModule: true,
    personalConnectors: true,
    analyticsExport: false,
    knowledgeBase: true,
    functionVersioning: true,
    maxEmployees: 50,
    maxStoredActions: 200,
    retentionDays: 180,
    availableReasoningProviders: ['deepseek_v4_flash', 'gemini'],
  },
  enterprise: {
    learningMode: true,
    remoteControl: true,
    performanceAnalytics: true,
    policyTemplates: true,
    actionMarketplace: true,
    multiProfileMachines: true,
    complianceExport: true,
    customVoiceBranding: true,
    bringYourOwnApiKey: true,
    thirdPartyFunctionsEnabled: true,
    detailedActivityLogging: true,
    aiHttpRequestsEnabled: true,
    multiDeviceSync: true,
    hrModule: true,
    personalConnectors: true,
    analyticsExport: true,
    knowledgeBase: true,
    functionVersioning: true,
    maxEmployees: 999999,
    maxStoredActions: 999999,
    retentionDays: 365,
    availableReasoningProviders: ['deepseek_v4_flash', 'gemini'],
  },
};

function resolvePlan(org) {
  if (!org) {
    return { ...PLAN_DEFAULTS.personal_free };
  }
  const base = PLAN_DEFAULTS[org.plan] || PLAN_DEFAULTS.personal_free;
  const overrides = org.featureFlags || {};
  return { ...base, ...overrides };
}

function checkFeature(features, featureName) {
  if (features[featureName] === undefined) return false;
  return Boolean(features[featureName]);
}

module.exports = { PLAN_DEFAULTS, resolvePlan, checkFeature };
