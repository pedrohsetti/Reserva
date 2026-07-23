const blockTenantRequests = (req, res, next) => {
  const businessId = req.user?.businessId || req.headers['x-business-id'] || req.params.businessId || req.body?.businessId;

  if (!businessId) {
    return res.status(400).json({ message: 'Business context required' });
  }

  if (req.params.businessId && String(req.params.businessId) !== String(businessId)) {
    return res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }

  if (req.body?.businessId && String(req.body.businessId) !== String(businessId)) {
    return res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }

  req.businessId = String(businessId);
  return next();
};

module.exports = { blockTenantRequests };