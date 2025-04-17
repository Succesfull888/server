const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get current user's profile
router.get('/me', auth, userController.getMe);

// Get all users (admin only)
router.get('/', [auth, admin], userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', [auth, admin], userController.getUserById);

// Update user (admin only)
router.put('/:id', [auth, admin], userController.updateUser);

// Reset user password (admin only)
router.put('/:id/reset-password', [auth, admin], userController.resetPassword);

// Delete user (admin only)
router.delete('/:id', [auth, admin], userController.deleteUser);

module.exports = router;