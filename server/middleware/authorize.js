// admin role
const authorize = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }
};

// owner role
const authorizeOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }
};

// staff role
const authorizeStaff = (req, res, next) => {
  if (req.user && req.user.role === 'staff') {
    next();
    } else {
    res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }
};

// customer role
const authorizeCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, insufficient privileges' });
  }
};

module.exports = { authorize, authorizeOwner, authorizeStaff, authorizeCustomer };