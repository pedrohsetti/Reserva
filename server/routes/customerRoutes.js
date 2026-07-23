const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { blockTenantRequests } = require('../middleware/tenant');
const {
	listCustomers,
	createCustomer,
	getCustomer,
	updateCustomer,
	deleteCustomer,
} = require('../controllers/customerController');

const router = express.Router();

router.use(protect, blockTenantRequests, authorize('admin', 'owner', 'staff'));
router.get('/', listCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize('admin', 'owner'), deleteCustomer);

module.exports = router;
