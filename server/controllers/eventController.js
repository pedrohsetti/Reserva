const asyncHandler = require('../utils/asyncHandler');
const Event = require('../models/Event');
const { ensureEventCapacity } = require('../services/eventService');
const { sendEventConfirmation } = require('../services/notificationService');

const listEvents = asyncHandler(async (req, res) => {
	const events = await Event.find({ businessId: req.businessId || req.user.businessId });
	res.json({ events });
});

const createEvent = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const event = await Event.create({ ...req.body, businessId });
	res.status(201).json({ event });
});

const getEvent = asyncHandler(async (req, res) => {
	const event = await Event.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}
	res.json({ event });
});

const updateEvent = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	if (typeof req.body.capacity === 'number') {
		await ensureEventCapacity({ eventId: req.params.id, businessId, capacity: req.body.capacity });
	}

	const event = await Event.findOneAndUpdate({ _id: req.params.id, businessId }, req.body, { new: true, runValidators: true });
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}
	res.json({ event });
});

const deleteEvent = asyncHandler(async (req, res) => {
	const event = await Event.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}
	res.json({ message: 'Event deleted' });
});

module.exports = { listEvents, createEvent, getEvent, updateEvent, deleteEvent };
