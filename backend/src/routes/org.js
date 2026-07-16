const { Router } = require('express');
const Organization = require('../models/Organization');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(404).json({ error: 'No organization found' });
    }

    const org = await Organization.findById(orgId).select('-stripeCustomerId');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ org });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

router.put('/', requireAuth, requireRole('owner', 'company_admin'), async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(404).json({ error: 'No organization found' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { name, featureFlags, branding, reasoningProvider, speechProvider, secondaryReasoningProviders, lockdownActive, tokenQuotaStatus } = req.body;

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid organization name' });
      }
      org.name = name.trim();
    }

    if (featureFlags !== undefined) {
      if (typeof featureFlags !== 'object' || Array.isArray(featureFlags)) {
        return res.status(400).json({ error: 'featureFlags must be an object' });
      }
      const validFlags = ['learningMode', 'remoteControl', 'performanceAnalytics', 'policyTemplates', 'actionMarketplace', 'multiProfileMachines', 'complianceExport', 'customVoiceBranding', 'bringYourOwnApiKey', 'thirdPartyFunctionsEnabled', 'detailedActivityLogging', 'aiHttpRequestsEnabled', 'multiDeviceSync', 'hrModule'];
      for (const [key, value] of Object.entries(featureFlags)) {
        if (!validFlags.includes(key)) continue;
        org.featureFlags[key] = Boolean(value);
      }
    }

    if (branding !== undefined) {
      if (typeof branding !== 'object' || Array.isArray(branding)) {
        return res.status(400).json({ error: 'branding must be an object' });
      }
      const brandingKeys = ['displayName', 'shortName', 'companyName', 'supportEmail', 'supportUrl', 'iconPath', 'trayIconPath', 'splashPath', 'widgetLogoPath', 'lightWebLogoPath', 'darkWebLogoPath', 'faviconPath', 'emailHeaderLogoPath', 'defaultAssistantName', 'defaultVoice', 'defaultWakeSound'];
      for (const [key, value] of Object.entries(branding)) {
        if (!brandingKeys.includes(key)) continue;
        if (value === null || value === undefined) {
          org.branding[key] = undefined;
        } else {
          org.branding[key] = String(value);
        }
      }
    }

    if (reasoningProvider !== undefined) {
      const valid = ['deepseek_v4_flash', 'gemini'];
      if (!valid.includes(reasoningProvider)) {
        return res.status(400).json({ error: `Invalid reasoning provider: ${reasoningProvider}` });
      }
      org.reasoningProvider = reasoningProvider;
    }

    if (speechProvider !== undefined) {
      const valid = ['deepseek_v4_flash', 'gemini'];
      if (!valid.includes(speechProvider)) {
        return res.status(400).json({ error: `Invalid speech provider: ${speechProvider}` });
      }
      org.speechProvider = speechProvider;
    }

    if (secondaryReasoningProviders !== undefined) {
      if (!Array.isArray(secondaryReasoningProviders)) {
        return res.status(400).json({ error: 'secondaryReasoningProviders must be an array' });
      }
      org.secondaryReasoningProviders = secondaryReasoningProviders.filter((p) => ['deepseek_v4_flash', 'gemini'].includes(p));
    }

    if (lockdownActive !== undefined) {
      if (req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Only the owner can change lockdown status' });
      }
      org.lockdownActive = Boolean(lockdownActive);
    }

    if (tokenQuotaStatus !== undefined) {
      if (req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Only the owner can change token quota status' });
      }
      const valid = ['healthy', 'low', 'exhausted'];
      if (!valid.includes(tokenQuotaStatus)) {
        return res.status(400).json({ error: 'Invalid token quota status' });
      }
      org.tokenQuotaStatus = tokenQuotaStatus;
    }

    await org.save();

    const sanitized = org.toObject();
    delete sanitized.stripeCustomerId;
    delete sanitized.__v;

    res.json({ org: sanitized });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

module.exports = router;
