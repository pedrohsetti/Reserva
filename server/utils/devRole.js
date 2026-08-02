const env = require('../config/env');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isDevEmail = (email) => normalizeEmail(email) === normalizeEmail(env.DEV_USERS_EMAIL);

const applyDevRole = (user) => {
	const shouldBeDev = isDevEmail(user.email);

	if (shouldBeDev) {
		// Ensure the developer account has the `dev` role and no business context.
		user.role = 'dev';
		user.businessId = null;
		return true;
	}

	// No demotion logic: do not modify a user's role away from 'dev' here.
	return false;
};

module.exports = { isDevEmail, applyDevRole };