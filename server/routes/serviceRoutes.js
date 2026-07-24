const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listServices,
	createService,
	getService,
	updateService,
	deleteService,
} = require('../controllers/serviceController');

const router = express.Router();

router.use(protect, blockTenantRequests, authorize('admin', 'owner', 'staff'));
router.get('/', listServices);
router.post('/', authorize('admin', 'owner', 'staff'), createService);
router.get('/:id', getService);
router.put('/:id', authorize('admin', 'owner', 'staff'), updateService);
router.delete('/:id', authorize('admin', 'owner', 'staff'), deleteService);

module.exports = router;
