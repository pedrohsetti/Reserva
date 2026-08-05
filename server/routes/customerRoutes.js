const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listCustomers,
	createCustomer,
	getMyCustomer,
	joinBusiness,
	getCustomer,
	updateCustomer,
	deleteCustomer,
} = require('../controllers/customerController');

const router = express.Router();

router.post('/join-business/:businessId', protect, authorize('customer'), joinBusiness);
router.use(protect, blockTenantRequests);
router.get('/me', authorize('customer'), getMyCustomer);

// Customer profile endpoints (accessible by customers and staff/admin/owner)
router.get('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), getCustomer);
router.put('/:id', authorize('dev', 'admin', 'owner', 'staff', 'customer'), updateCustomer);

// List/Create/Delete endpoints (staff/admin/owner only)
router.use(authorize('dev', 'admin', 'owner', 'staff'));
router.get('/', listCustomers);
router.post('/', createCustomer);
router.delete('/:id', authorize('dev', 'admin', 'owner'), deleteCustomer);

module.exports = router;
