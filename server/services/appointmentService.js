const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Staff = require('../models/Staff');

function toDate(value) {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw Object.assign(new Error('Invalid appointment date'), { status: 400 });
	}

	return date;
}

function timeToMinutes(time) {
	const [hours, minutes] = String(time || '').split(':').map(Number);
	return (hours || 0) * 60 + (minutes || 0);
}

function isWithinWorkingHours(staff, startAt, endAt) {
	const schedule = staff.workingHours || {};
	const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const day = dayNames[startAt.getUTCDay()];
	const window = schedule[day];

	if (!window || !window.start || !window.end) {
		return true;
	}

	const startMinutes = startAt.getUTCHours() * 60 + startAt.getUTCMinutes();
	const endMinutes = endAt.getUTCHours() * 60 + endAt.getUTCMinutes();
	const openMinutes = timeToMinutes(window.start);
	const closeMinutes = timeToMinutes(window.end);

	return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

async function ensureAppointmentSlot({ businessId, staffId, serviceId, startAt, endAt, excludeAppointmentId = null }) {
	const [service, staff] = await Promise.all([
		Service.findOne({ _id: serviceId, businessId, status: 'active' }),
		Staff.findOne({ _id: staffId, businessId, status: 'active' }),
	]);

	if (!service) {
		throw Object.assign(new Error('Service not found'), { status: 404 });
	}

	if (!staff) {
		throw Object.assign(new Error('Staff not found'), { status: 404 });
	}

	const startDate = toDate(startAt);
	const endDate = toDate(endAt);

	if (endDate <= startDate) {
		throw Object.assign(new Error('Appointment end time must be after start time'), { status: 400 });
	}

	const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;

	if (durationMinutes < service.durationMinutes) {
		throw Object.assign(new Error('Appointment duration is shorter than the selected service'), { status: 400 });
	}

	if (!isWithinWorkingHours(staff, startDate, endDate)) {
		throw Object.assign(new Error('Appointment is outside staff working hours'), { status: 400 });
	}

	const overlapQuery = {
		businessId,
		staffId,
		status: { $nin: ['cancelled'] },
		startAt: { $lt: endDate },
		endAt: { $gt: startDate },
	};

	if (excludeAppointmentId) {
		overlapQuery._id = { $ne: excludeAppointmentId };
	}

	const overlappingAppointment = await Appointment.findOne(overlapQuery);

	if (overlappingAppointment) {
		throw Object.assign(new Error('Staff already has an appointment in that time slot'), { status: 400 });
	}

	return { service, staff, startAt: startDate, endAt: endDate };
}

module.exports = { ensureAppointmentSlot };
