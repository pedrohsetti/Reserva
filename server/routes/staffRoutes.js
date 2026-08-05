const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listStaff,
	getMyStaff,
	createStaff,
	getStaff,
	updateStaff,
	deleteStaff,
	getAvailability,
	updateAvailability,
} = require('../controllers/staffController');

const router = express.Router();

router.use(protect, blockTenantRequests);

// Availability routes (accessible by staff for own, admin/owner for any)
router.get('/me', authorize('dev', 'admin', 'owner', 'staff'), getMyStaff);
router.get('/:id/availability', authorize('dev', 'admin', 'owner', 'staff'), getAvailability);
router.put('/:id/availability', authorize('dev', 'admin', 'owner', 'staff'), updateAvailability);

// Main staff routes (admin/owner only)
router.use(authorize('dev', 'admin', 'owner'));
router.get('/', listStaff);
router.post('/', createStaff);
router.get('/:id', getStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
