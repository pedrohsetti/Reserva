const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
		status: {
			type: String,
			enum: ['registered', 'waitlisted', 'cancelled', 'checked-in'],
			default: 'registered',
		},
		qrCode: { type: String, default: '' },
		checkedInAt: { type: Date, default: null },
		notes: { type: String, trim: true, default: '' },
	},
	{ timestamps: true }
);

registrationSchema.index({ eventId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
