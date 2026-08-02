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
router.get('/', authorize('dev', 'admin', 'owner', 'staff', 'customer'), listEvents);
router.post('/', authorize('dev', 'admin', 'owner', 'staff'), createEvent);
router.get('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), getEvent);
router.put('/:id', authorize('dev', 'admin', 'owner', 'staff'), updateEvent);
router.delete('/:id', authorize('dev', 'admin', 'owner', 'staff'), deleteEvent);

module.exports = router;
