const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Member = require('../models/Member');

const createContactError = (message) => {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
};

const syncContactUser = async ({ name, email, phone, role, businessId }) => {
	const contactName = String(name || '').trim();
	const contactEmail = String(email || '').trim().toLowerCase();
	const contactPhone = String(phone || '').trim();

	if (!contactName) {
		throw createContactError('Name is required');
	}

	if (!contactEmail) {
		throw createContactError('Email is required');
	}

	let user = await User.findOne({ email: contactEmail });

	if (user) {
		user.name = contactName;
		user.email = contactEmail;
		user.phone = contactPhone;
		user.role = role;
		user.businessId = businessId;
		await user.save({ validateBeforeSave: true });
	} else {
		const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
		user = await User.create({
			name: contactName,
			email: contactEmail,
			phone: contactPhone,
			password: hashedPassword,
			role,
			businessId,
		});
	}

	await Member.findOneAndUpdate(
		{ businessId, userId: user._id },
		{ businessId, userId: user._id, name: user.name, email: user.email, phone: user.phone, role },
		{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
	);

	return user;
};

module.exports = { syncContactUser };