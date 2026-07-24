const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		name: { type: String, required: true, trim: true },
		email: { type: String, trim: true, lowercase: true, default: '' },
		phone: { type: String, trim: false, default: '' },
		notes: { type: String, trim: false, default: '' },
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
	},
	{ timestamps: true }
);

customerSchema.index({ businessId: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);
