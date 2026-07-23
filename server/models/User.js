const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		password: { type: String, required: true, select: false },
		role: {
			type: String,
			enum: ['admin', 'owner', 'staff', 'customer'],
			default: 'customer',
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'suspended'],
			default: 'active',
		},
		businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },
		refreshToken: { type: String, default: null, select: false },
	},
	{ timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
