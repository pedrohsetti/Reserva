const asyncHandler = require('../utils/asyncHandler');
const Business = require('../models/Business');
const Member = require('../models/Member');

const listBusinesses = asyncHandler(async (req, res) => {
	const businesses = await Business.find();
	res.json({ businesses });
});

const getBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findById(req.params.id);
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	res.json({ business });
});

const createBusiness = asyncHandler(async (req, res) => {
	const { name, slug, email, phone, address, description } = req.body;
	const business = await Business.create({ name, slug, email, phone, address, description, ownerId: req.user.id });
	await Member.create({ businessId: business._id, userId: req.user.id, role: 'owner' });
	res.status(201).json({ business });
});

const updateBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	res.json({ business });
});

const deleteBusiness = asyncHandler(async (req, res) => {
	const business = await Business.findByIdAndDelete(req.params.id);
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}
	await Member.deleteMany({ businessId: req.params.id });
	res.json({ message: 'Business deleted' });
});

module.exports = { listBusinesses, getBusiness, createBusiness, updateBusiness, deleteBusiness };
