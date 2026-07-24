const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		status: {
			type: String,
			enum: ['active', 'inactive', 'archived'],
			default: 'active',
		},
		email: { type: String, trim: true, lowercase: true, default: '' },
		phone: { type: String, trim: true, default: '' },
		address: { type: String, trim: false, default: '' },
		description: { type: String, required: false, trim: false, default: '' }
	},
	{ timestamps: true }
);
module.exports = mongoose.model('Business', businessSchema);
