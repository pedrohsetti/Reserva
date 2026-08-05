const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	discoverEvents,
	listEvents,
	createEvent,
	getEvent,
	updateEvent,
	deleteEvent,
	registerForEvent,
	unregisterFromEvent,
	getEventRegistrations,
} = require('../controllers/eventController');

const router = express.Router();

router.get('/discover', protect, discoverEvents);
router.use(protect, blockTenantRequests);
router.get('/', authorize('dev', 'admin', 'owner', 'staff', 'customer'), listEvents);
router.post('/', authorize('dev', 'admin', 'owner', 'staff'), createEvent);
router.get('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), getEvent);
router.put('/:id', authorize('dev', 'admin', 'owner', 'staff'), updateEvent);
router.delete('/:id', authorize('dev', 'admin', 'owner', 'staff'), deleteEvent);

// Event registration routes
router.post('/:id/register', authorize('customer'), registerForEvent);
router.delete('/:id/register', authorize('customer'), unregisterFromEvent);
router.get('/:id/registrations', authorize('dev', 'admin', 'owner', 'staff'), getEventRegistrations);

module.exports = router;
