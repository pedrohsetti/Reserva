import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Unauthorized from '../pages/Unauthorized';

/**
 * RoleProtectedRoute - Wraps routes to enforce role-based access control
 * If user's role is not in allowedRoles, redirects to 404 Unauthorized page
 *
 * @param {JSX.Element} element - Component to render if authorized
 * @param {string[]} allowedRoles - Array of role strings that can access this route
 * @param {string} requiredRole - Optional: single role requirement (alternative to allowedRoles)
 */
const RoleProtectedRoute = ({ element, allowedRoles = [], requiredRole }) => {
	const { user } = useAuth();

	// If no user, let Navigate handle redirect (auth middleware in App.js)
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// Determine allowed roles
	const roles = requiredRole ? [requiredRole] : allowedRoles;

	// Dev role always has access
	if (user.role === 'dev') {
		return element;
	}

	// Check if user's role is in allowed roles
	if (roles && roles.length > 0 && !roles.includes(user.role)) {
		return <Unauthorized userRole={user.role} />;
	}

	return element;
};

export default RoleProtectedRoute;
