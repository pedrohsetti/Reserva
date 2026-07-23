const asyncHandler = require('../utils/asyncHandler');
const Staff = require('../models/Staff');

const listStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.find({ businessId: req.businessId || req.user.businessId });
	res.json({ staff });
});

const createStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.create({ ...req.body, businessId: req.businessId || req.user.businessId });
	res.status(201).json({ staff });
});

const getStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	res.json({ staff });
});

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

const deleteStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	res.json({ message: 'Staff deleted' });
});

module.exports = { listStaff, createStaff, getStaff, updateStaff, deleteStaff };
