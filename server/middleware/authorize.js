const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (roles.length === 0 || roles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({ message: 'Not authorized, insufficient privileges' });
};

module.exports = { authorize };