const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const User = require('../models/User');
const Member = require('../models/Member');

const accessToken = (user) => jwt.sign({ id: user._id, role: user.role, businessId: user.businessId || null }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const refreshToken = (user) => jwt.sign({ id: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const register = asyncHandler(async (req, res) => {
	const { name, email, password, role = 'customer', businessId = null } = req.body;

	if (!name || !email || !password) {
		return res.status(400).json({ message: 'Name, email, and password are required' });
	}

	const existingUser = await User.findOne({ email: email.toLowerCase() });
	if (existingUser) {
		return res.status(400).json({ message: 'User already exists' });
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, password: hashedPassword, role, businessId });

	if (businessId) {
		await Member.create({ businessId, userId: user._id, role });
	}

	const token = accessToken(user);
	const refresh = refreshToken(user);
	user.refreshToken = refresh;
	await user.save({ validateBeforeSave: false });

	res.status(201).json({
		user: { id: user._id, name: user.name, email: user.email, role: user.role, businessId: user.businessId },
		token,
		refreshToken: refresh,
	});
});

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

	const token = accessToken(user);
	const refresh = refreshToken(user);
	user.refreshToken = refresh;
	await user.save({ validateBeforeSave: false });

	res.json({
		user: { id: user._id, name: user.name, email: user.email, role: user.role, businessId: user.businessId },
		token,
		refreshToken: refresh,
	});
});

const logout = asyncHandler(async (req, res) => {
	if (req.user?.id) {
		await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
	}

	res.json({ message: 'Logged out' });
});

const refresh = asyncHandler(async (req, res) => {
	const token = req.body.refreshToken;
	if (!token) {
		return res.status(400).json({ message: 'Refresh token required' });
	}

	const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
	const user = await User.findById(decoded.id).select('+refreshToken');

	if (!user || user.refreshToken !== token) {
		return res.status(401).json({ message: 'Not authorized' });
	}

	res.json({ token: accessToken(user) });
});

const currentUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user.id).select('-password -refreshToken');
	res.json({ user });
});

module.exports = { register, login, logout, refresh, currentUser };
