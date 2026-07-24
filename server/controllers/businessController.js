const asyncHandler = require('../utils/asyncHandler');
const Business = require('../models/Business');
const Member = require('../models/Member');
const User = require('../models/User');

// @desc    Get all businesses
// @route   GET /api/businesses
// @access  Private/Dev
const listBusinesses = asyncHandler(async (req, res) => {
	const businesses = await Business.find();
	res.json({ businesses });
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
const createBusiness = asyncHandler(async (req, res) => {
	const { name, email, phone, address, description } = req.body;
	const business = await Business.create({ name, email, phone, address, description, ownerId: req.user.id });
	const owner = await User.findById(req.user.id).select('name email phone');
	await Member.create({ businessId: business._id, userId: req.user.id, name: owner.name, email: owner.email, phone: owner.phone || '', role: 'owner' });
	await User.findByIdAndUpdate(req.user.id, { businessId: business._id });
	res.status(201).json({ business });
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

module.exports = { listBusinesses, getBusiness, createBusiness, updateBusiness, deleteBusiness };
