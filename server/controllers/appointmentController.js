const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Staff = require('../models/Staff');
const { ensureAppointmentSlot } = require('../services/appointmentService');
const { sendAppointmentConfirmation } = require('../services/notificationService');

async function getActorStaffRecord(req, businessId) {
	return Staff.findOne({ userId: req.user.id, businessId, status: 'active' });
}

// @desc    Get all appointments (filtered by role)
// @route   GET /api/appointments
// @access  Private/Admin/Owner/Staff/Customer
const listAppointments = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const filter = { businessId };

	// Customers see only their own appointments
	if (req.user.role === 'customer') {
		const customer = await Customer.findOne({ userId: req.user.id, businessId });
		if (customer) {
			filter.customerId = customer._id;
		} else {
			return res.json({ appointments: [] }); // No customer record found
		}
	}

	if (req.user.role === 'staff') {
		const staff = await Staff.findOne({ userId: req.user.id, businessId });
		if (!staff) {
			return res.json({ appointments: [] });
		}
		filter.staffId = staff._id;
	}

	// Admin/Owner see all appointments in their business (no filter)
	// Dev sees all (filter is global businessId only)

	const appointments = await Appointment.find(filter)
		.populate('customerId', 'name email phone')
		.populate('serviceId', 'name durationMinutes')
		.populate('staffId', 'name email')
		.sort({ startAt: -1 });

	res.json({ appointments });
});

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private/Admin/Owner/Staff/Customer
const createAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const payload = { ...req.body };

	if (req.user.role === 'customer') {
		const customer = await Customer.findOne({ userId: req.user.id, businessId });
		if (!customer) {
			return res.status(400).json({ message: 'Customer record not found for this business' });
		}
		payload.customerId = customer._id;
	}
	if (req.user.role === 'staff') {
		const staff = await getActorStaffRecord(req, businessId);
		if (!staff) {
			return res.status(403).json({ message: 'Staff profile not found for this business' });
		}
		payload.staffId = staff._id;
	}

	const { service, staff, startAt, endAt } = await ensureAppointmentSlot({ businessId, ...payload });
	// derive legacy `date` and `time` fields expected by the model
	const startDate = new Date(startAt);
	const timeStr = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;
	const appointment = await Appointment.create({ ...payload, businessId, startAt, endAt, date: startDate, time: timeStr });

	await sendAppointmentConfirmation({
		businessId,
		recipientId: payload.customerId,
		recipientType: 'Customer',
		relatedId: appointment._id,
		message: `Your appointment for ${service.name} is booked.`,
	});

	res.status(201).json({ appointment, staff, service });
});

// @desc    Get a single appointment
// @route   GET /api/appointments/:id
// @access  Private/Admin/Owner/Staff/Customer
const getAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const filter = { _id: req.params.id, businessId };

	// Customers can only view their own appointments
	if (req.user.role === 'customer') {
		const customer = await Customer.findOne({ userId: req.user.id, businessId });
		if (customer) {
			filter.customerId = customer._id;
		} else {
			return res.status(403).json({ message: 'Not authorized to view this appointment' });
		}
	}
	if (req.user.role === 'staff') {
		const staff = await getActorStaffRecord(req, businessId);
		if (!staff) {
			return res.status(403).json({ message: 'Not authorized to view this appointment' });
		}
		filter.staffId = staff._id;
	}

	const appointment = await Appointment.findOne(filter)
		.populate('customerId', 'name email phone')
		.populate('serviceId', 'name durationMinutes price')
		.populate('staffId', 'name email phone');

	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}

	res.json({ appointment });
});

// @desc    Update an appointment (status updates by staff, full updates by admin/owner)
// @route   PUT /api/appointments/:id
// @access  Private/Admin/Owner/Staff
const updateAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ message: 'Invalid appointment ID' });
	}

	const appointment = await Appointment.findOne({ _id: req.params.id, businessId });
	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}

	// Staff can only update status (confirm/cancel)
	if (req.user.role === 'staff') {
		const staff = await Staff.findOne({ userId: req.user.id, businessId });
		if (!staff || String(appointment.staffId) !== String(staff._id)) {
			return res.status(403).json({ message: 'Not authorized to update this appointment' });
		}

		const validStatuses = ['booked', 'confirmed', 'completed', 'cancelled', 'no-show'];
		if (req.body.status && !validStatuses.includes(req.body.status)) {
			return res.status(400).json({ message: 'Invalid status' });
		}
		if (req.body.status) {
			appointment.status = req.body.status;
		}
		if (req.body.notes) {
			appointment.notes = req.body.notes;
		}
		// Staff cannot modify other fields
	} else {
		// Admin/Owner can update any field
		const nextStaffId = req.body.staffId || appointment.staffId;
		const nextServiceId = req.body.serviceId || appointment.serviceId;
		const nextStartAt = req.body.startAt || appointment.startAt;
		const nextEndAt = req.body.endAt || appointment.endAt;

		if (
			req.body.staffId ||
			req.body.serviceId ||
			req.body.startAt ||
			req.body.endAt
		) {
			const slot = await ensureAppointmentSlot({
				businessId,
				staffId: nextStaffId,
				serviceId: nextServiceId,
				startAt: nextStartAt,
				endAt: nextEndAt,
				excludeAppointmentId: appointment._id,
			});
			req.body.staffId = slot.staff._id;
			req.body.serviceId = slot.service._id;
			req.body.startAt = slot.startAt;
			req.body.endAt = slot.endAt;
		}

		Object.keys(req.body).forEach((key) => {
			if (key !== 'businessId') {
				appointment[key] = req.body[key];
			}
		});
	}

	await appointment.save({ validateBeforeSave: true });
	const updatedAppointment = await appointment
		.populate('customerId', 'name email phone')
		.populate('serviceId', 'name durationMinutes price')
		.populate('staffId', 'name email phone');

	res.json({ appointment: updatedAppointment });
});

// @desc    Delete an appointment
// @route   DELETE /api/appointments/:id
// @access  Private/Admin/Owner/Staff
const deleteAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ message: 'Invalid appointment ID' });
	}

	const filter = { _id: req.params.id, businessId };
	if (req.user.role === 'staff') {
		const staff = await getActorStaffRecord(req, businessId);
		if (!staff) {
			return res.status(403).json({ message: 'Not authorized to delete this appointment' });
		}
		filter.staffId = staff._id;
	}
	const appointment = await Appointment.findOneAndDelete(filter);
	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}

	res.json({ message: 'Appointment deleted' });
});

module.exports = { listAppointments, createAppointment, getAppointment, updateAppointment, deleteAppointment };
