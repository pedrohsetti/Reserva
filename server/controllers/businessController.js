const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const Business = require('../models/Business');
const Member = require('../models/Member');
const User = require('../models/User');
const env = require('../config/env');

const accessToken = (user) => jwt.sign({ id: user._id, role: user.role, businessId: user.businessId || null }, env.JWT_ACCESS_TOKEN, { expiresIn: '15m' });

// @desc    Get all businesses
// @route   GET /api/businesses
// @access  Private/Dev
const listBusinesses = asyncHandler(async (req, res) => {
	const businesses = await Business.find();
	res.json({ businesses });
});

// @desc    Discover active businesses for authenticated explorers
// @route   GET /api/businesses/discover
// @access  Private
const discoverBusinesses = asyncHandler(async (_req, res) => {
	const businesses = await Business.find({ status: 'active' })
		.select('name slug email phone address description status')
		.sort({ name: 1 });

	res.json({ businesses });
});

// @desc    Get current user's business
// @route   GET /api/businesses/me
// @access  Private (owner, admin, staff)
const getMyBusiness = asyncHandler(async (req, res) => {
	const { businessId } = req;

	if (!businessId) {
		return res.status(400).json({ message: 'No business associated with this user' });
	}

	const business = await Business.findById(businessId);
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}

	res.json({ business });
});

// @desc    Get a single business
// @route   GET /api/businesses/:id
// @access  Private/Admin/Owner
const getBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findById(req.params.id);
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	res.json({ business });
});

// @desc    Create a business
// @route   POST /api/businesses
// @access  Private/Admin/Owner
const slugify = require('../utils/slugify');

const createBusiness = asyncHandler(async (req, res) => {
	const { name, email, phone, address, description } = req.body;

	const actor = await User.findById(req.user.id).select('name email phone role businessId');
	if (!actor) {
		return res.status(404).json({ message: 'User not found' });
	}

	if (actor.role === 'customer' && actor.businessId) {
		return res.status(400).json({ message: 'This account is already linked to a business' });
	}

	const existingOwnedBusiness = await Business.findOne({ ownerId: actor._id }).select('_id');
	if (existingOwnedBusiness) {
		return res.status(400).json({ message: 'This account already owns a business' });
	}

	if (!name || !name.trim()) {
		return res.status(400).json({ message: 'Business name is required' });
	}

	// generate base slug and ensure uniqueness
	const baseSlug = slugify(name) || 'biz';
	let attempt = baseSlug;
	let counter = 0;
	while (await Business.findOne({ slug: attempt })) {
		counter += 1;
		attempt = `${baseSlug}-${counter}`;
	}

	const business = await Business.create({ name, slug: attempt, email, phone, address, description, ownerId: actor._id });
	actor.role = 'owner';
	actor.businessId = business._id;
	await actor.save({ validateBeforeSave: true });
	await Member.findOneAndUpdate(
		{ businessId: business._id, userId: actor._id },
		{ businessId: business._id, userId: actor._id, name: actor.name, email: actor.email, phone: actor.phone || '', role: 'owner' },
		{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
	);

	res.status(201).json({
		business,
		user: {
			id: actor._id,
			name: actor.name,
			email: actor.email,
			phone: actor.phone || '',
			role: actor.role,
			businessId: actor.businessId,
		},
		token: accessToken(actor),
	});
});

// @desc    Update a business
// @route   PUT /api/businesses/:id
// @access  Private/Admin/Owner
const updateBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	res.json({ business });
});

// @desc    Delete a business
// @route   DELETE /api/businesses/:id
// @access  Private/Admin
const deleteBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findByIdAndDelete(req.params.id);
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	await Member.deleteMany({ businessId: req.params.id });
	res.json({ message: 'Business deleted' });
});

module.exports = { listBusinesses, discoverBusinesses, getMyBusiness, getBusiness, createBusiness, updateBusiness, deleteBusiness };
