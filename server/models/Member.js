const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
	{
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		name: { type: String, required: true, trim: true },
		email: { type: String, trim: true, lowercase: true, default: '' },
		phone: { type: String, trim: true, default: '' },
		role: {
			type: String,
			enum: ['admin', 'owner', 'staff', 'customer'],
			default: 'customer',
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'invited'],
			default: 'active',
		},
	},
	{ timestamps: true }
);

memberSchema.index({ businessId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Member', memberSchema);
