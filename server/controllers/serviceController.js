const asyncHandler = require('../utils/asyncHandler');
const Service = require('../models/Service');

const listServices = asyncHandler(async (req, res) => {
	const services = await Service.find({ businessId: req.businessId || req.user.businessId });
	res.json({ services });
});

const createService = asyncHandler(async (req, res) => {
	const service = await Service.create({ ...req.body, businessId: req.businessId || req.user.businessId });
	res.status(201).json({ service });
});

const getService = asyncHandler(async (req, res) => {
	const service = await Service.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	res.json({ service });
});

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

const deleteService = asyncHandler(async (req, res) => {
	const service = await Service.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	res.json({ message: 'Service deleted' });
});

module.exports = { listServices, createService, getService, updateService, deleteService };
