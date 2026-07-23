const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		name: { type: String, required: true, trim: true },
		description: { type: String, trim: true, default: '' },
		durationMinutes: { type: Number, required: true, min: 5 },
		bufferMinutes: { type: Number, default: 0, min: 0 },
		price: { type: Number, default: 0, min: 0 },
		status: {
			type: String,
			enum: ['active', 'inactive'],
			default: 'active',
		},
		staffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
	},
	{ timestamps: true }
);

serviceSchema.index({ businessId: 1, name: 1 });

module.exports = mongoose.model('Service', serviceSchema);
