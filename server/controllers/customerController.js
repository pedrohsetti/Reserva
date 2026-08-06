const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const Event = require('../models/Event');
const Member = require('../models/Member');
const User = require('../models/User');
const Business = require('../models/Business');
const env = require('../config/env');
const { syncContactUser } = require('../utils/contactUser');

const accessToken = (user) => jwt.sign({ id: user._id, role: user.role, businessId: user.businessId || null }, env.JWT_ACCESS_TOKEN, { expiresIn: '15m' });

// @desc    Get all customers (staff sees only customers linked to own appointments/events)
// @route   GET /api/customers
// @access  Private/Admin/Owner/Staff
const listCustomers = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	let filter = { businessId };

	// Staff see only customers that have appointments with them
	// or are registered in events assigned to them.
	if (req.user.role === 'staff') {
		const staff = await Staff.findOne({ userId: req.user.id, businessId });
		if (!staff) {
			return res.json({ customers: [] }); // No staff record found
		}

		const appointmentCustomerIds = await Appointment.distinct('customerId', {
			businessId,
			staffId: staff._id,
			status: { $in: ['booked', 'confirmed', 'completed', 'no-show'] },
		});

		const eventCustomerUserIds = await Event.aggregate([
			{ $match: { businessId: new mongoose.Types.ObjectId(businessId), staffIds: staff._id } },
			{ $unwind: '$registeredUsers' },
			{ $match: { 'registeredUsers.status': { $ne: 'cancelled' } } },
			{ $group: { _id: '$registeredUsers.customerId' } },
		]);

		const eventCustomers = await Customer.find({
			businessId,
			userId: { $in: eventCustomerUserIds.map((entry) => entry._id) },
		}).select('_id');

		const customerIds = [
			...new Set([
				...appointmentCustomerIds.map((id) => String(id)),
				...eventCustomers.map((customer) => String(customer._id)),
			]),
		];

		filter._id = { $in: customerIds };
	}

	const customers = await Customer.find(filter).populate('userId', 'email phone');
	res.json({ customers });
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private/Admin/Owner/Staff
const createCustomer = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const user = await syncContactUser({
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		role: 'customer',
		businessId,
	});
	const customer = await Customer.create({ ...req.body, businessId, userId: user._id, name: user.name, email: user.email, phone: user.phone || '' });
	res.status(201).json({ customer });
});

// @desc    Get current customer's record
// @route   GET /api/customers/me
// @access  Private/Customer
const getMyCustomer = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;
	const customer = await Customer.findOne({ userId: req.user.id, businessId }).populate('userId', 'email phone');

	if (!customer) {
		return res.status(404).json({ message: 'Customer record not found' });
	}

	res.json({ customer });
});

// @desc    Join a business as a customer
// @route   POST /api/customers/join-business/:businessId
// @access  Private/Customer
const joinBusiness = asyncHandler(async (req, res) => {
	const { businessId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(businessId)) {
		return res.status(400).json({ message: 'Invalid business ID' });
	}

	const user = await User.findById(req.user.id).select('name email phone role businessId');
	if (!user) {
		return res.status(404).json({ message: 'User not found' });
	}

	if (user.role !== 'customer') {
		return res.status(403).json({ message: 'Only customer accounts can join a business' });
	}

	if (user.businessId) {
		return res.status(400).json({ message: 'This account is already linked to a business' });
	}

	const business = await Business.findOne({ _id: businessId, status: 'active' }).select('name slug status');
	if (!business) {
		return res.status(404).json({ message: 'Business not found' });
	}

	const customer = await Customer.findOneAndUpdate(
		{ businessId: business._id, userId: user._id },
		{
			businessId: business._id,
			userId: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone || '',
			status: 'active',
		},
		{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
	);

	await Member.findOneAndUpdate(
		{ businessId: business._id, userId: user._id },
		{
			businessId: business._id,
			userId: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone || '',
			role: 'customer',
			status: 'active',
		},
		{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
	);

	user.businessId = business._id;
	await user.save({ validateBeforeSave: true });

	res.json({
		customer,
		business,
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone || '',
			role: user.role,
			businessId: user.businessId,
		},
		token: accessToken(user),
	});
});

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private/Admin/Owner/Staff/Customer (customers can only view themselves)
const getCustomer = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ message: 'Invalid customer ID' });
	}

	// Customers can only view their own profile
	if (req.user.role === 'customer') {
		const customer = await Customer.findOne({ userId: req.user.id, businessId });
		if (!customer || customer._id.toString() !== req.params.id) {
			return res.status(403).json({ message: 'Not authorized to view this customer profile' });
		}
		res.json({ customer });
	} else {
		const customer = await Customer.findOne({ _id: req.params.id, businessId });
		if (!customer) {
			return res.status(404).json({ message: 'Customer not found' });
		}
		res.json({ customer });
	}
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin/Owner/Staff/Customer (customers can only update themselves)
const updateCustomer = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ message: 'Invalid customer ID' });
	}

	// Customers can only update their own profile
	if (req.user.role === 'customer') {
		const customer = await Customer.findOne({ userId: req.user.id, businessId });
		if (!customer || customer._id.toString() !== req.params.id) {
			return res.status(403).json({ message: 'Not authorized to update this customer profile' });
		}
		// Customers can only update specific fields
		const allowedFields = ['name', 'phone'];
		const updateData = {};
		allowedFields.forEach((field) => {
			if (req.body[field]) {
				updateData[field] = req.body[field];
			}
		});
		Object.assign(customer, updateData);
		await customer.save();
		res.json({ customer });
	} else {
		// Admin/Owner/Staff can update any field
		const customer = await Customer.findOneAndUpdate(
			{ _id: req.params.id, businessId },
			req.body,
			{ new: true, runValidators: true }
		);
		if (!customer) {
			return res.status(404).json({ message: 'Customer not found' });
		}
		res.json({ customer });
	}
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin/Owner
const deleteCustomer = asyncHandler(async (req, res) => {
	const businessId = req.businessId || req.user.businessId;

	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).json({ message: 'Invalid customer ID' });
	}

	const customer = await Customer.findOneAndDelete({ _id: req.params.id, businessId });
	if (!customer) {
		return res.status(404).json({ message: 'Customer not found' });
	}

	res.json({ message: 'Customer deleted' });
});

module.exports = { listCustomers, createCustomer, getMyCustomer, joinBusiness, getCustomer, updateCustomer, deleteCustomer };
