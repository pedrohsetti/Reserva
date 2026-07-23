const express = require('express');
const { register, login, logout, refresh, currentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refresh);
router.get('/me', protect, currentUser);

module.exports = router;
