const express = require('express')
const router = express.Router()
const { getUsers, getMe, getUserById, updateUser } = require('../controllers/userController')
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('dev'), getUsers)
router.get('/me', protect, getMe)
router.get('/:id', protect, authorize('dev'), getUserById);
router.put('/:id', protect, authorize('dev', 'admin', 'owner'), updateUser);

module.exports = router;