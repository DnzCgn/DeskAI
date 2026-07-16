const Organization = require('../models/Organization');
const { resolvePlan } = require('../config/plans');

async function resolvePlanConfig(req, res, next) {
  try {
    if (req.user && req.user.organization) {
      const org = await Organization.findById(req.user.organization).lean();
      if (org) {
        req.organization = org;
        req.features = resolvePlan(org);
        req.quota = org.tokenQuotaStatus || 'healthy';
        req.orgConfig = {
          reasoningProvider: org.reasoningProvider || 'deepseek_v4_flash',
          speechProvider: org.speechProvider || 'gemini',
          secondaryReasoningProviders: org.secondaryReasoningProviders || [],
        };
        req.isLockedDown = org.lockdownActive === true;
        return next();
      }
    }

    req.organization = null;
    req.features = resolvePlan(null);
    req.quota = 'healthy';
    req.orgConfig = {
      reasoningProvider: 'deepseek_v4_flash',
      speechProvider: 'gemini',
      secondaryReasoningProviders: [],
    };
    req.isLockedDown = false;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { resolvePlanConfig };
