const { verifyToken } = require('../services/auth');
const User = require('../models/User');
const Organization = require('../models/Organization');

const ROLE_HIERARCHY = {
  owner: ['owner'],
  company_admin: ['owner', 'company_admin'],
  department_manager: ['owner', 'company_admin', 'department_manager'],
  team_lead: ['owner', 'company_admin', 'department_manager', 'team_lead'],
  employee: ['owner', 'company_admin', 'department_manager', 'team_lead', 'employee'],
  auditor: ['auditor'],
};

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-passwordHash -mfaSecret');
    if (!user || user.offboarded) {
      return res.status(401).json({ error: 'User not found or offboarded' });
    }
    req.user = user;

    if (user.organization) {
      try {
        const org = await Organization.findById(user.organization).select('lockdownActive').lean();
        const isLockedDown = org?.lockdownActive === true;
        req.isLockedDown = isLockedDown;

        const isOrgEndpoint = req.baseUrl === '/api/org' && req.method === 'PUT';
        if (isLockedDown && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS' && !isOrgEndpoint) {
          return res.status(403).json({ error: 'Organization is in emergency lockdown. All write operations are suspended.' });
        }
      } catch {
        req.isLockedDown = false;
      }
    } else {
      req.isLockedDown = false;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }
    const allowedRoles = new Set(roles.flatMap((r) => ROLE_HIERARCHY[r] || [r]));
    if (!allowedRoles.has(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }
    next();
  };
}

function requireDepartmentScope(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Department scope required' });
  }
  if (req.user.role === 'owner' || req.user.role === 'company_admin') {
    return next();
  }
  const targetDepartment = req.params.department || req.body.department;
  if (!targetDepartment || req.user.department !== targetDepartment) {
    return res.status(403).json({ error: 'Outside department scope' });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireDepartmentScope };
