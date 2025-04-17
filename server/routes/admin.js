const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const examController = require('../controllers/exam');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all users
router.get('/users', [auth, admin], userController.getAllUsers);

// Get all exams
router.get('/exams', [auth, admin], examController.getAllExams);

// Delete user
router.delete('/users/:id', [auth, admin], userController.deleteUser);

// Update user
router.put('/users/:id', [auth, admin], userController.updateUser);

// Reset user password
router.put('/users/:id/reset-password', [auth, admin], userController.resetPassword);

module.exports = router;