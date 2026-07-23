const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
		ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		status: {
			type: String,
			enum: ['active', 'inactive', 'archived'],
			default: 'active',
		},
		email: { type: String, trim: true, lowercase: true, default: '' },
		phone: { type: String, trim: true, default: '' },
		address: { type: String, trim: true, default: '' },
		description: { type: String, trim: true, default: '' },
	},
	{ timestamps: true }
);

businessSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Business', businessSchema);
