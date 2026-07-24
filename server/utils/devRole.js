const env = require('../config/env');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isDevEmail = (email) => normalizeEmail(email) === normalizeEmail(env.DEV_USERS_EMAIL);

const applyDevRole = (user) => {
	const shouldBeDev = isDevEmail(user.email);

	if (shouldBeDev) {
		user.role = 'dev';
		user.businessId = null;
		return true;
	}

	if (user.role === 'dev') {
		user.role = 'customer';
		user.businessId = null;
		return true;
	}

	return false;
};

module.exports = { isDevEmail, applyDevRole };