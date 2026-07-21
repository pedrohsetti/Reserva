// block tenant-specific requests
const blockTenantRequests = (req, res, next) => {
  if (req.user && req.user.role === 'tenant') {
    res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  } else {
    next();
  }
};

module.exports = { blockTenantRequests };