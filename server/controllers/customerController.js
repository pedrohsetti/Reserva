const asyncHandler = require('../utils/asyncHandler');
const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin/Owner/Staff
const listCustomers = asyncHandler(async (req, res) => {
	const customers = await Customer.find({ businessId: req.businessId || req.user.businessId });
	res.json({ customers });
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private/Admin/Owner/Staff
const createCustomer = asyncHandler(async (req, res) => {
	const customer = await Customer.create({ ...req.body, businessId: req.businessId || req.user.businessId });
	res.status(201).json({ customer });
});

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private/Admin/Owner/Staff
const getCustomer = asyncHandler(async (req, res) => {
	const customer = await Customer.findOne({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!customer) {
		return res.status(404).json({ message: 'Customer not found' });
	}
	res.json({ customer });
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin/Owner/Staff
const updateCustomer = asyncHandler(async (req, res) => {
	const customer = await Customer.findOneAndUpdate(
		{ _id: req.params.id, businessId: req.businessId || req.user.businessId },
		req.body,
		{ new: true, runValidators: true }
	);
	if (!customer) {
		return res.status(404).json({ message: 'Customer not found' });
	}
	res.json({ customer });
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin/Owner
const deleteCustomer = asyncHandler(async (req, res) => {
	const customer = await Customer.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user.businessId });
	if (!customer) {
		return res.status(404).json({ message: 'Customer not found' });
	}
	res.json({ message: 'Customer deleted' });
});

module.exports = { listCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer };
