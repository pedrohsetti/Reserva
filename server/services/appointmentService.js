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

function dateKeyLocal(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function isDayOff(staff, startAt) {
	const startDay = dateKeyLocal(startAt);
	return (staff.daysOff || []).some((dayOff) => dateKeyLocal(new Date(dayOff)) === startDay);
}

function getWorkingWindow(staff, serviceId, startAt) {
	const schedule = staff.workingHours || {};
	const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const day = dayNames[startAt.getDay()];
	const override = (staff.serviceAvailability || []).find(
		(entry) => String(entry.serviceId) === String(serviceId)
	);

	return override?.workingHours?.[day] || schedule[day] || null;
}

function isWithinWorkingHours(staff, serviceId, startAt, endAt) {
	if (staff.status !== 'active' || isDayOff(staff, startAt)) {
		return false;
	}

	const window = getWorkingWindow(staff, serviceId, startAt);

	if (!window || !window.start || !window.end) {
		return false;
	}

	const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
	const endMinutes = endAt.getHours() * 60 + endAt.getMinutes();
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

	if (!service.staffIds?.some((assignedStaffId) => String(assignedStaffId) === String(staff._id))) {
		throw Object.assign(new Error('Selected staff member is not assigned to this service'), { status: 400 });
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

	if (!isWithinWorkingHours(staff, service._id, startDate, endDate)) {
		throw Object.assign(new Error('Appointment is outside staff working hours'), { status: 400 });
	}

	const overlapQuery = {
		businessId,
		staffId,
		status: { $in: ['booked', 'confirmed'] },
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
