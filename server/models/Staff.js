const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		name: { type: String, required: true, trim: true },
		email: { type: String, trim: true, lowercase: true, default: '' },
		phone: { type: String, trim: true, default: '' },
		role: {
			type: String,
			enum: ['staff', 'manager', 'admin'],
			default: 'staff',
		},
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
		serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
		workingHours: {
			monday: { start: String, end: String },
			tuesday: { start: String, end: String },
			wednesday: { start: String, end: String },
			thursday: { start: String, end: String },
			friday: { start: String, end: String },
			saturday: { start: String, end: String },
			sunday: { start: String, end: String },
		},
		daysOff: [{ type: Date }], // Specific dates staff member is unavailable
		serviceAvailability: [
			{
				serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
				workingHours: {
					monday: { start: String, end: String },
					tuesday: { start: String, end: String },
					wednesday: { start: String, end: String },
					thursday: { start: String, end: String },
					friday: { start: String, end: String },
					saturday: { start: String, end: String },
					sunday: { start: String, end: String },
				},
			},
		],
	},
	{ timestamps: true }
);

staffSchema.index({ businessId: 1, email: 1 });

module.exports = mongoose.model('Staff', staffSchema);
