const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listStaff,
	createStaff,
	getStaff,
	updateStaff,
	deleteStaff,
} = require('../controllers/staffController');

const router = express.Router();

router.use(protect, blockTenantRequests, authorize('dev', 'admin', 'owner'));
router.get('/', listStaff);
router.post('/', createStaff);
router.get('/:id', getStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
