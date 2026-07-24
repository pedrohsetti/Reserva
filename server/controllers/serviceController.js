const asyncHandler = require('../utils/asyncHandler');
const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Private/Admin/Owner/Staff
const listServices = asyncHandler(async (req, res) => {
	const services = await Service.find({ businessId: req.businessId || req.user.businessId });
	res.json({ services });
});

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin/Owner
const createService = asyncHandler(async (req, res) => {
	const service = await Service.create({ ...req.body, businessId: req.businessId || req.user.businessId });
	res.status(201).json({ service });
});

// @desc    Get a single service
// @route   GET /api/services/:id
// @access  Private/Admin/Owner/Staff
const getService = asyncHandler(async (req, res) => {
	const service = await Service.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	res.json({ service });
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin/Owner
const updateService = asyncHandler(async (req, res) => {
	const service = await Service.findOneAndUpdate(
		{ _id: req.params.id, businessId: req.businessId || req.user.businessId },
		req.body,
		{ new: true, runValidators: true }
	);
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	res.json({ service });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin/Owner
const deleteService = asyncHandler(async (req, res) => {
	const service = await Service.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	res.json({ message: 'Service deleted' });
});

module.exports = { listServices, createService, getService, updateService, deleteService };
