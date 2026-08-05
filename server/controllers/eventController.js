const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const Staff = require('../models/Staff');
const env = require('../config/env');

async function getActorStaffRecord(req) {
	return Staff.findOne({ userId: req.user.id, businessId: req.businessId || req.user.businessId, status: 'active' });
}

const accessToken = (user) => jwt.sign({ id: user._id, role: user.role, businessId: user.businessId || null }, env.JWT_ACCESS_TOKEN, { expiresIn: '15m' });

// @desc    Discover upcoming events without tenant context
// @route   GET /api/events/discover
// @access  Private
const discoverEvents = asyncHandler(async (req, res) => {
	const filter = {
		status: 'scheduled',
		endDate: { $gte: new Date() },
	};

	if (req.query.businessId) {
		filter.businessId = req.query.businessId;
	}

	const events = await Event.find(filter)
		.populate('businessId', 'name slug')
		.populate('createdBy', 'name email')
		.populate('staffIds', 'name email')
		.sort({ startDate: 1 });

	res.json({ events });
});

// @desc    List events (filtered by role and businessId)
// @route   GET /api/events
// @access  Private
const listEvents = asyncHandler(async (req, res) => {
	const { businessId } = req;
	const { status, category } = req.query;
	const filter = {};

	// Filter by business (all roles see only their business, except dev)
	if (req.user.role !== 'dev') {
		if (!businessId) {
			return res.status(400).json({ message: 'Business context required' });
		}
		filter.businessId = businessId;
	} else if (req.query.businessId) {
		filter.businessId = req.query.businessId;
	}

	// Additional filters
	if (status) filter.status = status;
	if (category) filter.category = category;
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff) {
			return res.json({ events: [] });
		}
		filter.$or = [{ createdBy: req.user.id }, { staffIds: actorStaff._id }];
	}

	const events = await Event.find(filter)
		.populate('createdBy', 'name email')
		.populate('staffIds', 'name email')
		.sort({ startDate: 1 });

	res.json({ events });
});

// @desc    Get event details
// @route   GET /api/events/:id
// @access  Private
const getEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id)
		.populate('createdBy', 'name email')
		.populate('staffIds', 'name email')
		.populate('registeredUsers.customerId', 'name email');

	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Check business access (all roles see only their business, except dev)
	if (req.user.role !== 'dev' && String(event.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to view this event' });
	}

	res.json({ event });
});

// @desc    Create event
// @route   POST /api/events
// @access  Private (admin, owner, staff)
const createEvent = asyncHandler(async (req, res) => {
	const { businessId } = req;
	const { title, description, startDate, endDate, startTime, endTime, location, capacity, staffIds, price, category, image } = req.body;

	if (!businessId) {
		return res.status(400).json({ message: 'Business context required' });
	}

	// Validate required fields
	if (!title || !startDate || !endDate || !startTime || !endTime || !capacity) {
		return res.status(400).json({ message: 'Title, dates, times, and capacity are required' });
	}

	// Validate dates
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (start >= end) {
		return res.status(400).json({ message: 'Start date must be before end date' });
	}

	// Validate times are in HH:MM format
	if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
		return res.status(400).json({ message: 'Times must be in HH:MM format' });
	}

	// Validate capacity
	if (capacity < 1) {
		return res.status(400).json({ message: 'Capacity must be at least 1' });
	}

	let nextStaffIds = staffIds && Array.isArray(staffIds) ? staffIds : [];
	if (req.user.role === 'staff') {
		const actorStaff = await getActorStaffRecord(req);
		if (!actorStaff) {
			return res.status(403).json({ message: 'Staff profile not found for this business' });
		}
		nextStaffIds = [actorStaff._id];
	}

	if (nextStaffIds && Array.isArray(nextStaffIds)) {
		for (const staffId of nextStaffIds) {
			if (!mongoose.Types.ObjectId.isValid(staffId)) {
				return res.status(400).json({ message: 'Invalid staff ID' });
			}
			const staff = await Staff.findById(staffId);
			if (!staff || String(staff.businessId) !== String(businessId)) {
				return res.status(404).json({ message: 'Staff member not found or not in this business' });
			}
		}
	}

	const event = await Event.create({
		businessId,
		title,
		description,
		startDate: start,
		endDate: end,
		startTime,
		endTime,
		location,
		capacity,
		staffIds: nextStaffIds || [],
		price: price || 0,
		category: category || '',
		image: image || '',
		createdBy: req.user.id,
		status: 'scheduled',
	});

	const populatedEvent = await event.populate('createdBy', 'name email').populate('staffIds', 'name email');

	res.status(201).json({ event: populatedEvent });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (admin, owner, staff for own events)
const updateEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;
	const { title, description, startDate, endDate, startTime, endTime, location, capacity, staffIds, price, category, image, status } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id);
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Check business access
	if (String(event.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to update this event' });
	}

	// Check ownership for staff
	if (req.user.role === 'staff' && String(event.createdBy) !== String(req.user.id)) {
		return res.status(403).json({ message: 'Only the event creator can update this event' });
	}

	// Update fields
	if (title) event.title = title;
	if (description) event.description = description;
	if (location) event.location = location;
	if (capacity) event.capacity = capacity;
	if (price !== undefined) event.price = price;
	if (category) event.category = category;
	if (image) event.image = image;
	if (status) event.status = status;

	// Validate dates if provided
	if (startDate && endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start >= end) {
			return res.status(400).json({ message: 'Start date must be before end date' });
		}
		event.startDate = start;
		event.endDate = end;
	}

	// Validate times if provided
	if (startTime && endTime) {
		if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
			return res.status(400).json({ message: 'Times must be in HH:MM format' });
		}
		event.startTime = startTime;
		event.endTime = endTime;
	}

	// Update staff IDs if provided
	if (staffIds && Array.isArray(staffIds)) {
		if (req.user.role === 'staff') {
			return res.status(403).json({ message: 'Staff cannot reassign event staff' });
		}
		for (const staffId of staffIds) {
			if (!mongoose.Types.ObjectId.isValid(staffId)) {
				return res.status(400).json({ message: 'Invalid staff ID' });
			}
			const staff = await Staff.findById(staffId);
			if (!staff || String(staff.businessId) !== String(businessId)) {
				return res.status(404).json({ message: 'Staff member not found or not in this business' });
			}
		}
		event.staffIds = staffIds;
	}

	await event.save({ validateBeforeSave: true });
	const updatedEvent = await event.populate('createdBy', 'name email').populate('staffIds', 'name email');

	res.json({ event: updatedEvent });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (admin, owner, staff for own events)
const deleteEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id);
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Check business access
	if (String(event.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to delete this event' });
	}

	if (req.user.role === 'staff' && String(event.createdBy) !== String(req.user.id)) {
		return res.status(403).json({ message: 'Only the event creator can delete this event' });
	}

	await Event.findByIdAndDelete(id);

	res.json({ message: 'Event deleted successfully' });
});

// @desc    Register customer for event
// @route   POST /api/events/:id/register
// @access  Private (customer)
const registerForEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id);
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Check if event is still available
	if (event.status === 'cancelled') {
		return res.status(400).json({ message: 'This event has been cancelled' });
	}

	// Check capacity
	const activeRegistrations = event.registeredUsers.filter((r) => r.status !== 'cancelled').length;
	if (activeRegistrations >= event.capacity) {
		return res.status(400).json({ message: 'Event is at full capacity' });
	}

	// Check if already registered
	const existingRegistration = event.registeredUsers.find(
		(r) => String(r.customerId) === String(userId) && r.status === 'registered'
	);
	if (existingRegistration) {
		return res.status(400).json({ message: 'You are already registered for this event' });
	}

	// Add registration
	event.registeredUsers.push({
		customerId: userId,
		status: 'registered',
	});

	await event.save({ validateBeforeSave: false });
	const updatedEvent = await event.populate('registeredUsers.customerId', 'name email').populate('createdBy', 'name email');

	res.json({ event: updatedEvent, message: 'Successfully registered for event' });
});

// @desc    Unregister customer from event
// @route   DELETE /api/events/:id/register
// @access  Private (customer)
const unregisterFromEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id);
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Find and update registration to cancelled
	const registration = event.registeredUsers.find(
		(r) => String(r.customerId) === String(userId) && r.status === 'registered'
	);
	if (!registration) {
		return res.status(400).json({ message: 'You are not registered for this event' });
	}

	registration.status = 'cancelled';
	await event.save({ validateBeforeSave: false });
	const updatedEvent = await event.populate('registeredUsers.customerId', 'name email').populate('createdBy', 'name email');

	res.json({ event: updatedEvent, message: 'Successfully unregistered from event' });
});

// @desc    Get event registrations (staff/admin/owner only)
// @route   GET /api/events/:id/registrations
// @access  Private (staff, admin, owner)
const getEventRegistrations = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { businessId } = req;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ message: 'Invalid event ID' });
	}

	const event = await Event.findById(id).populate('registeredUsers.customerId', 'name email');
	if (!event) {
		return res.status(404).json({ message: 'Event not found' });
	}

	// Check business access
	if (String(event.businessId) !== String(businessId)) {
		return res.status(403).json({ message: 'Not authorized to view these registrations' });
	}

	// Check role: staff can only see registrations for their own events
	if (req.user.role === 'staff' && String(event.createdBy) !== String(req.user.id)) {
		return res.status(403).json({ message: 'You can only view registrations for your own events' });
	}

	res.json({ registrations: event.registeredUsers });
});

module.exports = {
	discoverEvents,
	listEvents,
	getEvent,
	createEvent,
	updateEvent,
	deleteEvent,
	registerForEvent,
	unregisterFromEvent,
	getEventRegistrations,
};
