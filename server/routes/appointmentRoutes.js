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
router.get('/', authorize('dev', 'admin', 'owner', 'staff', 'customer'), listAppointments);
router.post('/', authorize('dev', 'admin', 'owner', 'staff', 'customer'), createAppointment);
router.get('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), getAppointment);
router.put('/:id', authorize('dev', 'admin', 'owner', 'staff'), updateAppointment);
router.delete('/:id', authorize('dev', 'admin', 'owner', 'staff'), deleteAppointment);

module.exports = router;
