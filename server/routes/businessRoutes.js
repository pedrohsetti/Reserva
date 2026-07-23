const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
	listBusinesses,
	getBusiness,
	createBusiness,
	updateBusiness,
	deleteBusiness,
} = require('../controllers/businessController');

const router = express.Router();

router.get('/', protect, authorize('admin', 'owner'), listBusinesses);
router.post('/', protect, authorize('admin', 'owner'), createBusiness);
router.get('/:id', protect, authorize('admin', 'owner'), getBusiness);
router.put('/:id', protect, authorize('admin', 'owner'), updateBusiness);
router.delete('/:id', protect, authorize('admin'), deleteBusiness);

module.exports = router;
