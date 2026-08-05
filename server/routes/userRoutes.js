const express = require('express')
const router = express.Router()
const { getUsers, getMe, getUserById, updateUser, changePassword, deleteAccount, getPermissions } = require('../controllers/userController')
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('dev'), getUsers)
router.get('/me', protect, getMe)
router.get('/:id', protect, authorize('dev'), getUserById);
router.put('/:id', protect, authorize('dev', 'admin', 'owner', 'staff', 'customer'), updateUser);
router.patch('/:id/password', protect, changePassword);
router.delete('/:id', protect, deleteAccount);
router.get('/:id/permissions', protect, getPermissions);

module.exports = router;