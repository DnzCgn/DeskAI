function lockdownGuard(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (req.isLockedDown === true) {
    return res.status(403).json({ error: 'Organization is in emergency lockdown. All write operations are suspended.' });
  }

  next();
}

module.exports = { lockdownGuard };
