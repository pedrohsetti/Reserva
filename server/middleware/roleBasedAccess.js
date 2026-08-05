/**
 * Role-based access control middleware
 * Validates user role against allowed roles for a specific resource and operation
 * Usage: roleBasedAccess('service', 'create')(['admin', 'owner', 'staff'])
 */

const roleBasedAccess = (resource, operation) => {
  return (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Dev role always has access
      if (req.user.role === 'dev') {
        return next();
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Not authorized to ${operation} ${resource}`,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        });
      }

      next();
    };
  };
};

/**
 * Permission matrix for resources and operations
 * Can be used for reference and validation
 */
const ROLE_PERMISSIONS = {
  businesses: {
    list: ['dev'],
    create: ['dev', 'admin'],
    read: ['dev', 'admin', 'owner', 'staff', 'customer'],
    update: ['dev', 'admin', 'owner'],
    delete: ['dev', 'admin'],
  },
  services: {
    list: ['dev', 'admin', 'owner', 'staff', 'customer'],
    create: ['dev', 'admin', 'owner'],
    read: ['dev', 'admin', 'owner', 'staff', 'customer'],
    update: ['dev', 'admin', 'owner', 'staff'],
    delete: ['dev', 'admin', 'owner'],
  },
  events: {
    list: ['dev', 'admin', 'owner', 'staff', 'customer'],
    create: ['dev', 'admin', 'owner', 'staff'],
    read: ['dev', 'admin', 'owner', 'staff', 'customer'],
    update: ['dev', 'admin', 'owner', 'staff'],
    delete: ['dev', 'admin', 'owner'],
    register: ['customer'],
    unregister: ['customer'],
    viewRegistrations: ['dev', 'admin', 'owner', 'staff'],
  },
  staff: {
    list: ['dev', 'admin', 'owner'],
    create: ['dev', 'admin', 'owner'],
    read: ['dev', 'admin', 'owner'],
    update: ['dev', 'admin', 'owner'],
    delete: ['dev', 'admin', 'owner'],
    updateAvailability: ['dev', 'admin', 'owner', 'staff'],
    getAvailability: ['dev', 'admin', 'owner', 'staff'],
  },
  appointments: {
    list: ['dev', 'admin', 'owner', 'staff', 'customer'],
    create: ['dev', 'admin', 'owner', 'staff', 'customer'],
    read: ['dev', 'admin', 'owner', 'staff', 'customer'],
    update: ['dev', 'admin', 'owner', 'staff'],
    delete: ['dev', 'admin', 'owner'],
    updateStatus: ['dev', 'admin', 'owner', 'staff'],
  },
  customers: {
    list: ['dev', 'admin', 'owner', 'staff'],
    create: ['dev', 'admin', 'owner', 'staff'],
    read: ['dev', 'admin', 'owner', 'staff', 'customer'],
    update: ['dev', 'admin', 'owner', 'staff', 'customer'],
    delete: ['dev', 'admin', 'owner'],
  },
};

module.exports = { roleBasedAccess, ROLE_PERMISSIONS };
