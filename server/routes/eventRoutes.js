const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listEvents,
	createEvent,
	getEvent,
	updateEvent,
	deleteEvent,
} = require('../controllers/eventController');

const router = express.Router();

router.use(protect, blockTenantRequests);
router.get('/', authorize('admin', 'owner', 'staff', 'customer'), listEvents);
router.post('/', authorize('admin', 'owner'), createEvent);
router.get('/:id', authorize('admin', 'owner', 'staff', 'customer'), getEvent);
router.put('/:id', authorize('admin', 'owner'), updateEvent);
router.delete('/:id', authorize('admin', 'owner'), deleteEvent);

module.exports = router;
