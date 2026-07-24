const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		password: { type: String, required: true, select: false },
		role: {
			type: String,
			enum: ['dev', 'admin', 'owner', 'staff', 'customer'],
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
module.exports = mongoose.model('User', userSchema);
