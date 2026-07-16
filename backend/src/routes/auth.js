const crypto = require('crypto');
const { Router } = require('express');
const User = require('../models/User');
const Organization = require('../models/Organization');
const {
  hashPassword,
  comparePassword,
  signToken,
  generateMFASecret,
  generateMFAUri,
  verifyMFAToken,
} = require('../services/auth');
const { requireAuth, requireRole } = require('../middleware/auth');

const VALID_ROLES = ['owner', 'company_admin', 'department_manager', 'team_lead', 'employee', 'auditor'];

const ASSIGNABLE_ROLES = {
  owner: ['company_admin', 'department_manager', 'team_lead', 'employee', 'auditor'],
  company_admin: ['department_manager', 'team_lead', 'employee', 'auditor'],
  department_manager: ['team_lead', 'employee'],
};

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, role: 'owner' });

    const slugBase = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-').slice(0, 32);
    const slug = slugBase + '-' + user._id.toString().slice(-6);

    let org;
    try {
      org = await Organization.create({
        name: email.split('@')[0],
        slug,
        plan: 'personal_free',
        owner: user._id,
      });
    } catch (orgErr) {
      await User.findByIdAndDelete(user._id);
      throw orgErr;
    }

    user.organization = org._id;
    await user.save();

    const token = signToken({ userId: user._id });
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role, mode: user.mode, organization: user.organization } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.offboarded) {
      return res.status(401).json({ error: 'Account has been deactivated' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.mfaEnabled) {
      if (!mfaToken) {
        return res.json({ mfaRequired: true });
      }
      const mfaValid = verifyMFAToken(user.mfaSecret, mfaToken);
      if (!mfaValid) {
        return res.status(401).json({ error: 'Invalid MFA token' });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, mode: user.mode } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/mfa/setup', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled' });
    }

    const secret = generateMFASecret();
    const uri = generateMFAUri(user.email, secret);

    user.mfaSecret = secret;
    await user.save();

    res.json({ secret, uri });
  } catch (err) {
    res.status(500).json({ error: 'MFA setup failed' });
  }
});

router.post('/mfa/verify', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'MFA token is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not set up yet' });
    }

    const valid = verifyMFAToken(user.mfaSecret, token);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid MFA token' });
    }

    user.mfaEnabled = true;
    await user.save();

    res.json({ message: 'MFA enabled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const allowed = ['assistantName', 'assistantVoice', 'wakePhrase', 'languagePreference', 'keyboardShortcut', 'colorTheme'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updates.languagePreference && !['en', 'tr'].includes(updates.languagePreference)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    if (updates.colorTheme && !['light_green_black', 'light_green_white', 'light_orange_black', 'light_orange_white'].includes(updates.colorTheme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash -mfaSecret -setupToken');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

router.post('/set-password', async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: 'Email, token, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.setupToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired setup link' });
    }

    if (user.passwordHash) {
      return res.status(400).json({ error: 'Password already set' });
    }

    user.passwordHash = await hashPassword(password);
    user.setupToken = null;
    await user.save();

    const jwt = signToken({ userId: user._id });
    res.json({ token: jwt, user: { id: user._id, email: user.email, role: user.role, mode: user.mode } });
  } catch (err) {
    res.status(500).json({ error: 'Password setup failed' });
  }
});

router.get('/users', requireAuth, requireRole('owner', 'company_admin', 'department_manager'), async (req, res) => {
  try {
    const filter = { organization: req.user.organization };

    if (req.query.role) filter.role = req.query.role;
    if (req.query.offboarded !== undefined) filter.offboarded = req.query.offboarded === 'true';

    if (req.user.role === 'department_manager' && req.user.department) {
      filter.department = req.user.department;
    }

    const users = await User.find(filter).select('-passwordHash -mfaSecret -setupToken').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/invite', requireAuth, requireRole('owner', 'company_admin', 'department_manager'), async (req, res) => {
  try {
    const { email, role, department } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role: ${role}` });
    }

    const allowed = ASSIGNABLE_ROLES[req.user.role] || [];
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: `Cannot assign role "${role}" from your role` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      role,
      organization: req.user.organization,
      department: department || null,
      mode: 'enterprise',
      setupToken: crypto.randomBytes(32).toString('hex'),
    });

    const sanitized = user.toObject();
    delete sanitized.passwordHash;
    delete sanitized.mfaSecret;

    res.status(201).json({ user: sanitized, setupToken: user.setupToken });
  } catch (err) {
    res.status(500).json({ error: 'Invitation failed' });
  }
});

router.post('/offboard', requireAuth, requireRole('owner', 'company_admin'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const target = await User.findOne({ email: email.toLowerCase() });
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.organization?.toString() !== req.user.organization?.toString()) {
      return res.status(403).json({ error: 'User not in your organization' });
    }

    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot offboard yourself' });
    }

    if (target.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can offboard another owner' });
    }

    target.offboarded = true;
    target.sessions = [];
    await target.save();

    const sanitized = target.toObject();
    delete sanitized.passwordHash;
    delete sanitized.mfaSecret;
    delete sanitized.setupToken;

    res.json({ user: sanitized });
  } catch (err) {
    res.status(500).json({ error: 'Offboarding failed' });
  }
});

router.post('/mfa/disable', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable MFA' });
    }

    const user = await User.findById(req.user._id);
    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    res.json({ message: 'MFA disabled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'MFA disable failed' });
  }
});

module.exports = router;
