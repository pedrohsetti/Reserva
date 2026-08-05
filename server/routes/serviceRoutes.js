const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	discoverServices,
	listServices,
	createService,
	getService,
	updateService,
	deleteService,
	getAvailableSlots,
} = require('../controllers/serviceController');

const router = express.Router();

router.get('/discover', protect, discoverServices);
router.use(protect, blockTenantRequests);

// Available slots route (accessible to all authenticated users including customers)
router.get('/:id/slots', getAvailableSlots);

// Customer-accessible read routes
router.get('/', authorize('dev', 'admin', 'owner', 'staff', 'customer'), listServices);
router.get('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), getService);

// Management routes
router.use(authorize('dev', 'admin', 'owner', 'staff'));
router.post('/', authorize('dev', 'admin', 'owner', 'staff'), createService);
router.put('/:id', authorize('dev', 'admin', 'owner', 'staff'), updateService);
router.delete('/:id', authorize('dev', 'admin', 'owner', 'staff'), deleteService);

module.exports = router;
