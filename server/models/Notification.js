const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		recipientType: { type: String, enum: ['User', 'Customer', 'Staff'], required: true },
		recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
		type: {
			type: String,
			enum: ['confirmation', 'reminder', 'cancellation', 'update'],
			default: 'confirmation',
		},
		title: { type: String, required: true, trim: true },
		message: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: ['queued', 'sent', 'read'],
			default: 'queued',
		},
		readAt: { type: Date, default: null },
		relatedType: { type: String, trim: true, default: '' },
		relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
	},
	{ timestamps: true }
);

notificationSchema.index({ businessId: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
