const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const examController = require('../controllers/exam');
const upload = require('../middleware/upload');

// Root endpoint - API haqida ma'lumot
router.get('/', (req, res) => {
  res.json({
    message: 'CEFR Speaking Exam API',
    endpoints: ['/templates', '/my-exams', '/templates/:id', '/:id']
  });
});

// @route   GET api/exams/templates
// @desc    Get all exam templates
// @access  Private
router.get('/templates', auth, examController.getExamTemplates);

// @route   GET api/exams/templates/:id
// @desc    Get exam template by ID
// @access  Private
router.get('/templates/:id', auth, examController.getExamTemplateById);

// @route   POST api/exams/templates
// @desc    Create a new exam template
// @access  Admin
router.post('/templates', [auth, admin], examController.createExamTemplate);

// @route   PUT api/exams/templates/:id
// @desc    Update an exam template
// @access  Admin
router.put('/templates/:id', [auth, admin], examController.updateExamTemplate);

// @route   DELETE api/exams/templates/:id
// @desc    Delete an exam template
// @access  Admin
router.delete('/templates/:id', [auth, admin], examController.deleteExamTemplate);

// @route   POST api/exams/submit
// @desc    Submit an exam
// @access  Private
router.post('/submit', auth, examController.submitExam);

// @route   GET api/exams/my-exams
// @desc    Get user's exams
// @access  Private
router.get('/my-exams', auth, examController.getUserExams);

// @route   PUT api/exams/:id/evaluate
// @desc    Evaluate an exam
// @access  Admin
router.put('/:id/evaluate', [auth, admin], examController.evaluateExam);

// @route   GET api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id', auth, examController.getExamById);

module.exports = router;
