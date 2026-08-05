const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const { syncContactUser } = require('../utils/contactUser');
const { normalizeIds, validateStaffAssignments, syncStaffServiceAssignments } = require('../utils/serviceAssignments');

async function getActorStaffRecord(req) {
	return Staff.findOne({ userId: req.user.id, businessId: req.businessId || req.user.businessId });
}

async function validateServiceIdsForBusiness(businessId, serviceIds = []) {
	const normalizedServiceIds = normalizeIds(serviceIds);

	if (normalizedServiceIds.length === 0) {
		return [];
	}

	for (const serviceId of normalizedServiceIds) {
		if (!mongoose.Types.ObjectId.isValid(serviceId)) {
			throw Object.assign(new Error('Invalid service ID in staff assignment'), { status: 400 });
		}
	}

	const services = await Service.find({ businessId, _id: { $in: normalizedServiceIds } }).select('_id');
	if (services.length !== normalizedServiceIds.length) {
		throw Object.assign(new Error('Each assigned service must belong to this business'), { status: 400 });
	}

	return normalizedServiceIds;
}

async function syncServiceSideAssignments({ businessId, staffId, serviceIds }) {
	const normalizedServiceIds = normalizeIds(serviceIds);

	await Service.updateMany(
		{ businessId, _id: { $in: normalizedServiceIds } },
		{ $addToSet: { staffIds: staffId } }
	);

	await Service.updateMany(
		{ businessId, _id: { $nin: normalizedServiceIds } },
		{ $pull: { staffIds: staffId } }
	);

	return normalizedServiceIds;
}

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private/Admin/Owner
const listStaff = asyncHandler(async (req, res) => {
	const staff = await Staff.find({ businessId: req.businessId || req.user.businessId });
	res.json({ staff });
});

// @desc    Get current staff member profile
// @route   GET /api/staff/me
// @access  Private/Staff/Admin/Owner/Dev
const getMyStaff = asyncHandler(async (req, res) => {
	const staff = await getActorStaffRecord(req);
	if (!staff) {
		return res.status(404).json({ message: 'Staff profile not found' });
	}
	res.json({ staff });
});

// @desc    Create a staff member
// @route   POST /api/staff
// @access  Private/Admin/Owner
const createStaff = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const serviceIds = await validateServiceIdsForBusiness(businessId, req.body.serviceIds);
	const user = await syncContactUser({
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		role: 'staff',
		businessId,
	});
	const staff = await Staff.create({ ...req.body, serviceIds, businessId, userId: user._id, name: user.name, email: user.email, phone: user.phone || '' });
	await syncServiceSideAssignments({ businessId, staffId: staff._id, serviceIds });
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
	const businessId = req.businessId || req.user.businessId;
	const currentStaff = await Staff.findOne({ _id: req.params.id, businessId });
	if (!currentStaff) {
		return res.status(404).json({ message: 'Staff not found' });
	}

	const hasServiceIds = Object.prototype.hasOwnProperty.call(req.body, 'serviceIds');
	const serviceIds = hasServiceIds
		? await validateServiceIdsForBusiness(businessId, req.body.serviceIds)
		: currentStaff.serviceIds;

	const staff = await Staff.findOneAndUpdate(
		{ _id: req.params.id, businessId },
		{ ...req.body, serviceIds },
		{ new: true, runValidators: true }
	);
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	if (hasServiceIds) {
		await syncServiceSideAssignments({ businessId, staffId: staff._id, serviceIds });
	}
	res.json({ staff });
});

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin/Owner
const deleteStaff = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const staff = await Staff.findOneAndDelete({ _id: req.params.id, businessId });
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}
	await Service.updateMany({ businessId }, { $pull: { staffIds: staff._id } });
	res.json({ message: 'Staff deleted' });
});

// @desc    Get staff availability
// @route   GET /api/staff/:id/availability
// @access  Private (staff member can view own, admin/owner can view any)
const getAvailability = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid staff ID' });
	}

	const staff = await Staff.findById(id);
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}

	// Check access: staff can view own, admin/owner can view any in their business
	if (req.user.role === 'staff' && String(staff.userId) !== String(req.user.id)) {
		return res.status(403).json({ message: 'Not authorized to view this availability' });
	}

	if (String(staff.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to view this availability' });
	}

	res.json({
		staffId: staff._id,
		name: staff.name,
		workingHours: staff.workingHours || {},
		daysOff: staff.daysOff || [],
		serviceAvailability: staff.serviceAvailability || [],
	});
});

// @desc    Update staff availability
// @route   PUT /api/staff/:id/availability
// @access  Private (staff member can update own, admin/owner can update any)
const updateAvailability = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;
	const { workingHours, daysOff, serviceAvailability } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid staff ID' });
	}

	const staff = await Staff.findById(id);
	if (!staff) {
		return res.status(404).json({ message: 'Staff not found' });
	}

	// Check access: staff can update own, admin/owner can update any in their business
	if (req.user.role === 'staff' && String(staff.userId) !== String(req.user.id)) {
		return res.status(403).json({ message: 'Not authorized to update this availability' });
	}

	if (String(staff.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to update this availability' });
	}

	// Validate working hours format
	if (workingHours) {
		const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const timeRegex = /^\d{2}:\d{2}$/;
		for (const [day, hours] of Object.entries(workingHours)) {
			if (!validDays.includes(day.toLowerCase())) {
				return res.status(400).json({ message: `Invalid day: ${day}` });
			}
			if (hours && hours.start && !timeRegex.test(hours.start)) {
				return res.status(400).json({ message: `Invalid start time for ${day}. Use HH:MM format` });
			}
			if (hours && hours.end && !timeRegex.test(hours.end)) {
				return res.status(400).json({ message: `Invalid end time for ${day}. Use HH:MM format` });
			}
		}
		staff.workingHours = workingHours;
	}

	// Validate daysOff
	if (Array.isArray(daysOff)) {
		staff.daysOff = daysOff.map((date) => new Date(date));
	}

	// Validate serviceAvailability
	if (Array.isArray(serviceAvailability)) {
		await validateStaffAssignments({ businessId, staffIds: [staff._id] });
		const serviceIds = serviceAvailability.map((entry) => entry.serviceId).filter(Boolean);
		await validateServiceIdsForBusiness(businessId, serviceIds);
		staff.serviceAvailability = serviceAvailability;
	}

	await staff.save({ validateBeforeSave: true });

	res.json({
		staffId: staff._id,
		name: staff.name,
		workingHours: staff.workingHours || {},
		daysOff: staff.daysOff || [],
		serviceAvailability: staff.serviceAvailability || [],
		message: 'Availability updated successfully',
	});
});

module.exports = { listStaff, getMyStaff, createStaff, getStaff, updateStaff, deleteStaff, getAvailability, updateAvailability };
