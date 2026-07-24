const asyncHandler = require('../utils/asyncHandler');
const Staff = require('../models/Staff');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private/Admin/Owner
const listStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.find({ businessId: req.businessId || req.user.businessId });
	res.json({ staff });
});

// @desc    Create a staff member
// @route   POST /api/staff
// @access  Private/Admin/Owner
const createStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.create({ ...req.body, businessId: req.businessId || req.user.businessId });
	res.status(201).json({ staff });
});

// @desc    Get a single staff member
// @route   GET /api/staff/:id
// @access  Private/Admin/Owner
const getStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	res.json({ staff });
});

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin/Owner
const updateStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.findOneAndUpdate(
		{ _id: req.params.id, businessId: req.businessId || req.user.businessId },
		req.body,
		{ new: true, runValidators: true }
	);
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	res.json({ staff });
});

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin/Owner
const deleteStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	res.json({ message: 'Staff deleted' });
});

module.exports = { listStaff, createStaff, getStaff, updateStaff, deleteStaff };
