const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function ensureEventCapacity({ eventId, businessId, capacity }) {
	const currentRegistrations = await Registration.countDocuments({
		eventId,
		businessId,
		status: { $ne: 'cancelled' },
	});

	if (capacity < currentRegistrations) {
		throw Object.assign(new Error('Event capacity cannot be lower than the current registrations'), { status: 400 });
	}
}

async function ensureEventRegistration({ eventId, businessId }) {
	const event = await Event.findOne({ _id: eventId, businessId });

	if (!event) {
		throw Object.assign(new Error('Event not found'), { status: 404 });
	}

	const registrationCount = await Registration.countDocuments({
		eventId,
		businessId,
		status: { $ne: 'cancelled' },
	});

	if (registrationCount >= event.capacity && !event.allowWaitlist) {
		throw Object.assign(new Error('Event is at capacity'), { status: 400 });
	}

	return event;
}

module.exports = { ensureEventCapacity, ensureEventRegistration };
