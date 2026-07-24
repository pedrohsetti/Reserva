const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		title: { type: String, required: true, trim: true },
		description: { type: String, trim: true, default: '' },
		location: { type: String, trim: true, default: '' },
		date: { type: Date, required: true },
    	time: { type: Number, required: true },
    	tags: { type: String, required: false },
		capacity: { type: Number, required: true, min: 1 },
		status: {
			type: String,
			enum: ['draft', 'open', 'full', 'cancelled'],
			default: 'draft',
		},
		allowWaitlist: { type: Boolean, default: false },
		checkInEnabled: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

eventSchema.index({ businessId: 1, startAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
