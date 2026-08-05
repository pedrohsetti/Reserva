const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
		title: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		startTime: { type: String, required: true }, // HH:MM format
		endTime: { type: String, required: true }, // HH:MM format
		location: { type: String, default: '' },
		capacity: { type: Number, required: true, min: 1 },
		registeredUsers: [
			{
				customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
				registeredAt: { type: Date, default: Date.now },
				status: {
					type: String,
					enum: ['registered', 'attended', 'cancelled'],
					default: 'registered',
				},
			},
		],
		staffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
		price: { type: Number, default: 0 },
		category: { type: String, default: '' },
		status: {
			type: String,
			enum: ['scheduled', 'cancelled', 'completed'],
			default: 'scheduled',
		},
		image: { type: String, default: '' },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true }
);

eventSchema.index({ businessId: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
