const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
		serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
		staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
		startAt: { type: Date, required: true },
		endAt: { type: Date, required: true },
		date: { type: Date, required: true },
		time: { type: String, required: true },
		status: {
			type: String,
			enum: ['booked', 'confirmed', 'completed', 'cancelled', 'no-show'],
			default: 'booked',
		},
		notes: { type: String, trim: true, default: '' },
		checkInAt: { type: Date, default: null },
		cancelledAt: { type: Date, default: null },
		cancellationReason: { type: String, trim: true, default: '' },
	},
	{ timestamps: true }
);

appointmentSchema.index({ businessId: 1, staffId: 1, startAt: 1 });
appointmentSchema.index({ businessId: 1, customerId: 1, startAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
