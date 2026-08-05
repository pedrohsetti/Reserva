const mongoose = require('mongoose');
const Staff = require('../models/Staff');

function normalizeIds(ids = []) {
	return [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id)).filter(Boolean))];
}

async function validateStaffAssignments({ businessId, staffIds }) {
	const normalizedStaffIds = normalizeIds(staffIds);

	if (normalizedStaffIds.length === 0) {
		return [];
	}

	for (const staffId of normalizedStaffIds) {
		if (!mongoose.Types.ObjectId.isValid(staffId)) {
			throw Object.assign(new Error('Invalid staff ID in service assignment'), { status: 400 });
		}
	}

	const assignedStaff = await Staff.find({
		businessId,
		_id: { $in: normalizedStaffIds },
		status: 'active',
	}).select('_id');

	if (assignedStaff.length !== normalizedStaffIds.length) {
		throw Object.assign(new Error('Each assigned staff member must belong to this business and be active'), { status: 400 });
	}

	return normalizedStaffIds;
}

async function syncStaffServiceAssignments({ businessId, serviceId, staffIds }) {
	const normalizedStaffIds = normalizeIds(staffIds);

	await Staff.updateMany(
		{ businessId, _id: { $in: normalizedStaffIds } },
		{ $addToSet: { serviceIds: serviceId } }
	);

	await Staff.updateMany(
		{ businessId, _id: { $nin: normalizedStaffIds } },
		{ $pull: { serviceIds: serviceId } }
	);
	
	return normalizedStaffIds;
}

module.exports = { normalizeIds, validateStaffAssignments, syncStaffServiceAssignments };