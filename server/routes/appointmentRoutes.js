const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listAppointments,
	createAppointment,
	getAppointment,
	updateAppointment,
	deleteAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect, blockTenantRequests);
router.get('/', authorize('admin', 'owner', 'staff', 'customer'), listAppointments);
router.post('/', authorize('admin', 'owner', 'staff', 'customer'), createAppointment);
router.get('/:id', authorize('admin', 'owner', 'staff', 'customer'), getAppointment);
router.put('/:id', authorize('admin', 'owner', 'staff'), updateAppointment);
router.delete('/:id', authorize('admin', 'owner'), deleteAppointment);

module.exports = router;
