const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');
const { validateStaffAssignments, syncStaffServiceAssignments } = require('../utils/serviceAssignments');

async function getActorStaffRecord(req) {
	return Staff.findOne({ userId: req.user.id, businessId: req.businessId || req.user.businessId, status: 'active' });
}

const buildServiceProjection = () => 'businessId name description location tags durationMinutes bufferMinutes price status staffIds createdAt updatedAt';

// @desc    Discover active services without tenant context
// @route   GET /api/services/discover
// @access  Private
const discoverServices = asyncHandler(async (req, res) => {
	const filter = { status: 'active' };

	if (req.query.businessId) {
		filter.businessId = req.query.businessId;
	}

	const services = await Service.find(filter)
		.select(buildServiceProjection())
		.populate('businessId', 'name slug')
		.populate('staffIds', 'name email phone role')
		.sort({ name: 1 });

	res.json({ services });
});

// @desc    Get all services
// @route   GET /api/services
// @access  Private/Admin/Owner/Staff/Customer
const listServices = asyncHandler(async (req, res) => {
	const filter = { businessId: req.businessId || req.user.businessId };

	// Staff can see only their own services
	if (req.user.role === 'staff') {
		const staff = await Staff.findOne({ userId: req.user.id, businessId: req.businessId || req.user.businessId });
		if (staff) {
			filter._id = { $in: staff.serviceIds || [] };
		} else {
			return res.json({ services: [] }); // No staff record found
		}
	}

	const services = await Service.find(filter).populate('staffIds', 'name email phone role');
	res.json({ services });
});

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin/Owner
const createService = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	let staffIds = req.body.staffIds;
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff) {
			return res.status(403).json({ message: 'Staff profile not found for this business' });
		}
		staffIds = [actorStaff._id];
	}
	staffIds = await validateStaffAssignments({ businessId, staffIds });
	const service = await Service.create({ ...req.body, businessId, staffIds });
	await syncStaffServiceAssignments({ businessId, serviceId: service._id, staffIds });
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
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff || !service.staffIds?.some((staffId) => String(staffId) === String(actorStaff._id))) {
			return res.status(403).json({ message: 'Not authorized to view this service' });
		}
	}
	res.json({ service });
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin/Owner
const updateService = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const currentService = await Service.findOne({ _id: req.params.id, businessId });
	if (!currentService) {
		return res.status(404).json({ message: 'Service not found' });
	}
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff || !currentService.staffIds?.some((staffId) => String(staffId) === String(actorStaff._id))) {
			return res.status(403).json({ message: 'Not authorized to update this service' });
		}
	}

	const hasStaffIds = Object.prototype.hasOwnProperty.call(req.body, 'staffIds');
	const nextStaffIds = req.user.role === 'staff'
		? currentService.staffIds
		: hasStaffIds
			? req.body.staffIds
			: currentService.staffIds;
	const staffIds = hasStaffIds || req.user.role === 'staff'
		? await validateStaffAssignments({ businessId, staffIds: nextStaffIds })
		: currentService.staffIds;

	const service = await Service.findOneAndUpdate(
		{ _id: req.params.id, businessId },
		{ ...req.body, staffIds },
		{ new: true, runValidators: true }
	);
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	if (hasStaffIds || req.user.role === 'staff') {
		await syncStaffServiceAssignments({ businessId, serviceId: service._id, staffIds });
	}
	res.json({ service });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin/Owner
const deleteService = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const service = await Service.findOne({ _id: req.params.id, businessId });
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff || !service.staffIds?.some((staffId) => String(staffId) === String(actorStaff._id))) {
			return res.status(403).json({ message: 'Not authorized to delete this service' });
		}
	}
	await Service.deleteOne({ _id: service._id });
	await Staff.updateMany({ businessId }, { $pull: { serviceIds: service._id } });
	res.json({ message: 'Service deleted' });
});

// @desc    Get available appointment slots for a service
// @route   GET /api/services/:id/slots
// @access  Private (all authenticated users)
// @query   startDate (ISO string), endDate (ISO string), daysToShow (number, default 30)
const getAvailableSlots = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { startDate, endDate } = req.query;
	const daysToShow = Number(req.query.daysToShow || 30);
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid service ID' });
	}

	if (!Number.isFinite(daysToShow) || daysToShow <= 0) {
		return res.status(400).json({ message: 'daysToShow must be a positive number' });
	}

	const service = await Service.findOne({ _id: id, businessId, status: 'active' })
		.populate('staffIds', 'name status workingHours daysOff serviceAvailability');
	if (!service) {
		return res.status(404).json({ message: 'Service not found' });
	}

	// Validate dates
	let start = startDate ? new Date(startDate) : new Date();
	let end = endDate ? new Date(endDate) : new Date(start.getTime() + daysToShow * 24 * 60 * 60 * 1000);

	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return res.status(400).json({ message: 'Invalid date format. Use ISO 8601 format' });
	}

	if (start >= end) {
		return res.status(400).json({ message: 'Start date must be before end date' });
	}

	// Set start to beginning of day, end to end of day
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	// Get duration and interval (default values)
	const duration = service.durationMinutes || 60;
	const interval = 30; // 30-minute intervals

	if (duration <= 0) {
		return res.status(400).json({ message: 'Invalid service duration' });
	}

	// Get all staff assigned to this service
	if (!service.staffIds || service.staffIds.length === 0) {
		return res.json({ slots: [], message: 'No staff assigned to this service' });
	}

	// Get booked appointments in the date range
	const bookedAppointments = await Appointment.find({
		businessId,
		serviceId: id,
		staffId: { $in: service.staffIds.map((staff) => staff._id) },
		startAt: { $gte: start, $lte: end },
		status: { $in: ['booked', 'confirmed'] },
	});

	// Generate slots
	const slots = [];
	const dayInMs = 24 * 60 * 60 * 1000;

	for (let day = new Date(start); day <= end; day = new Date(day.getTime() + dayInMs)) {
		const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.getDay()];

		// Check if any staff is available this day
		let availableStaff = [];

		for (const staff of service.staffIds) {
			if (staff.status !== 'active') continue;

			// Check if staff is off this day
			const dayString = day.toISOString().split('T')[0];
			const isOffDay = staff.daysOff?.some((offDay) => offDay.toISOString().split('T')[0] === dayString);
			if (isOffDay) continue;

			// Get working hours for this staff on this day
			const workingHours = staff.workingHours?.[dayOfWeek] || staff.workingHours?.[dayOfWeek.toLowerCase()];
			if (!workingHours || !workingHours.start || !workingHours.end) continue;

			// Check service-specific availability
			const serviceAvail = staff.serviceAvailability?.find((sa) => sa.serviceId.toString() === id);
			const hours = serviceAvail?.workingHours?.[dayOfWeek] || workingHours;

			availableStaff.push({
				staffId: staff._id,
				staffName: staff.name,
				start: hours.start,
				end: hours.end,
			});
		}

		if (availableStaff.length === 0) continue;

		// Generate time slots
		for (const staff of availableStaff) {
			const [startHour, startMin] = staff.start.split(':').map(Number);
			const [endHour, endMin] = staff.end.split(':').map(Number);

			const dayStart = new Date(day);
			dayStart.setHours(startHour, startMin, 0, 0);

			const dayEnd = new Date(day);
			dayEnd.setHours(endHour, endMin, 0, 0);

			for (let slotTime = new Date(dayStart); slotTime.getTime() + duration * 60 * 1000 <= dayEnd.getTime(); slotTime = new Date(slotTime.getTime() + interval * 60 * 1000)) {
				const slotEnd = new Date(slotTime.getTime() + duration * 60 * 1000);

				// Check if slot conflicts with booked appointments
				const isBooked = bookedAppointments.some(
					(appt) => appt.staffId?.toString() === staff.staffId.toString() && appt.startAt < slotEnd && appt.endAt > slotTime
				);

				if (!isBooked) {
					slots.push({
						staffId: staff.staffId,
						staffName: staff.staffName,
						startAt: slotTime.toISOString(),
						endAt: slotEnd.toISOString(),
						startTime: `${slotTime.getHours().toString().padStart(2, '0')}:${slotTime.getMinutes().toString().padStart(2, '0')}`,
						date: slotTime.toISOString().split('T')[0],
					});
				}
			}
		}
	}

	res.json({ slots });
});

module.exports = { discoverServices, listServices, createService, getService, updateService, deleteService, getAvailableSlots };
