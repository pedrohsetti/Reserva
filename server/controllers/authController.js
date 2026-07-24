const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const User = require('../models/User');
const Member = require('../models/Member');
const Business = require('../models/Business');
const { isDevEmail, applyDevRole } = require('../utils/devRole');

const accessToken = (user) => jwt.sign({ id: user._id, role: user.role, businessId: user.businessId || null }, env.JWT_ACCESS_TOKEN, { expiresIn: '15m' });
const refreshToken = (user) => jwt.sign({ id: user._id }, env.JWT_REFRESH_TOKEN, { expiresIn: '7d' });

const ensureBusinessContext = async (user) => {
	if (!user || user.businessId) {
		return;
	}

	const member = await Member.findOne({ userId: user._id }).sort({ createdAt: 1 }).select('businessId');
	if (member?.businessId) {
		user.businessId = member.businessId;
		await user.save({ validateBeforeSave: false });
		return;
	}

	const ownedBusiness = await Business.findOne({ ownerId: user._id }).sort({ createdAt: 1 }).select('_id');
	if (ownedBusiness?._id) {
		user.businessId = ownedBusiness._id;
		await user.save({ validateBeforeSave: false });
		await Member.findOneAndUpdate(
			{ businessId: ownedBusiness._id, userId: user._id },
			{ businessId: ownedBusiness._id, userId: user._id, name: user.name, email: user.email, phone: user.phone || '', role: 'owner' },
			{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
		);
	}
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
	const { name, email, password, role = 'customer', businessId = null } = req.body;

	if (!name || !email || !password) {
		return res.status(400).json({ message: 'Name, email, and password are required' });
	}

	const existingUser = await User.findOne({ email: email.toLowerCase() });
	if (existingUser) {
		return res.status(400).json({ message: 'User already exists' });
	}

	if (role === 'dev' && !isDevEmail(email)) {
		return res.status(400).json({ message: 'Dev role is reserved for the configured developer email' });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, password: hashedPassword, role, businessId });

	const devRoleChanged = applyDevRole(user);
	if (devRoleChanged) {
		await user.save({ validateBeforeSave: false });
	}

	if (businessId && user.businessId) {
		await Member.create({ businessId: user.businessId, userId: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role });
	}

	const token = accessToken(user);
	const refresh = refreshToken(user);
	user.refreshToken = refresh;
	await user.save({ validateBeforeSave: false });

	res.status(201).json({
		user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role, businessId: user.businessId },
		token,
		refreshToken: refresh,
	});
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password +refreshToken');

	if (!user || !password) {
		return res.status(400).json({ message: 'Invalid credentials' });
	}

	const passwordMatches = await bcrypt.compare(password, user.password);
	if (!passwordMatches) {
		return res.status(400).json({ message: 'Invalid credentials' });
	}

	const devRoleChanged = applyDevRole(user);
	if (devRoleChanged) {
		await user.save({ validateBeforeSave: false });
		await Member.deleteMany({ userId: user._id });
	}

	if (!devRoleChanged) {
		await ensureBusinessContext(user);
	}

	const token = accessToken(user);
	const refresh = refreshToken(user);
	user.refreshToken = refresh;
	await user.save({ validateBeforeSave: false });

	res.json({
		user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role, businessId: user.businessId },
		token,
		refreshToken: refresh,
	});
});

// @desc    Log out a user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
	if (req.user?.id) {
		await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
	}

	res.json({ message: 'Logged out' });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refresh = asyncHandler(async (req, res) => {
	const token = req.body.refreshToken;
	if (!token) {
		return res.status(400).json({ message: 'Refresh token required' });
	}

	const decoded = jwt.verify(token, env.JWT_REFRESH_TOKEN);
	const user = await User.findById(decoded.id).select('+refreshToken');

	if (!user || user.refreshToken !== token) {
		return res.status(401).json({ message: 'Not authorized' });
	}

	res.json({ token: accessToken(user) });
});

module.exports = { register, login, logout, refresh };
