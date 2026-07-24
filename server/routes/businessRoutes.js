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

router.get('/', protect, authorize('dev'), listBusinesses);
router.post('/', protect, authorize('dev', 'admin', 'owner'), createBusiness);
router.get('/:id', protect, authorize('dev', 'admin', 'owner'), getBusiness);
router.put('/:id', protect, authorize('dev', 'admin', 'owner'), updateBusiness);
router.delete('/:id', protect, authorize('dev', 'admin', 'owner'), deleteBusiness);

module.exports = router;
