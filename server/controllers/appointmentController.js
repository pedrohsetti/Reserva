const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const { ensureAppointmentSlot } = require('../services/appointmentService');
const { sendAppointmentConfirmation } = require('../services/notificationService');

const listAppointments = asyncHandler(async (req, res) => {
	const appointments = await Appointment.find({ businessId: req.businessId || req.user.businessId });
	res.json({ appointments });
});

const createAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const { service, staff, startAt, endAt } = await ensureAppointmentSlot({ businessId, ...req.body });
	const appointment = await Appointment.create({ ...req.body, businessId, startAt, endAt });

	await sendAppointmentConfirmation({
		businessId,
		recipientId: req.body.customerId,
		recipientType: 'Customer',
		relatedId: appointment._id,
		message: `Your appointment for ${service.name} is booked.`,
	});

	res.status(201).json({ appointment, staff, service });
});

const getAppointment = asyncHandler(async (req, res) => {
	const appointment = await Appointment.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}
	res.json({ appointment });
});

const updateAppointment = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const appointment = await Appointment.findOneAndUpdate(
		{ _id: req.params.id, businessId },
		req.body,
		{ new: true, runValidators: true }
	);
	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}
	res.json({ appointment });
});

const deleteAppointment = asyncHandler(async (req, res) => {
	const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!appointment) {
		return res.status(404).json({ message: 'Appointment not found' });
	}
	res.json({ message: 'Appointment deleted' });
});

module.exports = { listAppointments, createAppointment, getAppointment, updateAppointment, deleteAppointment };
