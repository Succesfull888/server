const { ExamTemplate, Exam } = require('../models/Exam'); // Updated to match the correct casing
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get all exam templates
exports.getExamTemplates = async (req, res) => {
  try {
    const templates = await ExamTemplate.find().populate('createdBy', 'firstName lastName');
    res.json(templates);
  } catch (error) {
    console.error('Get exam templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single exam template
exports.getExamTemplateById = async (req, res) => {
  try {
    const template = await ExamTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Exam template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Get exam template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create exam template (admin only)
exports.createExamTemplate = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    
    const newTemplate = new ExamTemplate({
      title,
      description,
      questions,
      createdBy: req.user.id
    });

    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Create exam template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update exam template (admin only)
exports.updateExamTemplate = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    
    const template = await ExamTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Exam template not found' });
    }
    
    template.title = title || template.title;
    template.description = description || template.description;
    template.questions = questions || template.questions;
    
    await template.save();
    res.json(template);
  } catch (error) {
    console.error('Update exam template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete exam template (admin only)
exports.deleteExamTemplate = async (req, res) => {
  try {
    const template = await ExamTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Exam template not found' });
    }
    
    // Changed from template.remove() to findByIdAndDelete
    await ExamTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam template removed' });
  } catch (error) {
    console.error('Delete exam template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit exam
exports.submitExam = async (req, res) => {
  try {
    const { examTemplateId, responses } = req.body;
    
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save audio files
    const processedResponses = [];
    
    for (const response of responses) {
      const { questionId, audioBlob } = response;
      // Verify base64 data exists
      if (!audioBlob || !audioBlob.includes(';base64,')) {
        return res.status(400).json({ message: 'Invalid audio data' });
      }
      
      try {
        // Extract MIME type from the base64 string
        const mimeMatch = audioBlob.match(/^data:([^;]+);base64,/);
        let mimeType = mimeMatch ? mimeMatch[1] : 'audio/mp3';
        
        // Always set extension to mp3 for better compatibility
        const fileExt = '.mp3';
        
        // Remove the MIME type prefix to get the pure base64 content
        const audioBase64 = audioBlob.split(';base64,').pop();
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Log information for debugging
        console.log(`Saving audio file: ${fileName}, MIME: ${mimeType}`);
        
        // Write the file
        fs.writeFileSync(filePath, audioBase64, { encoding: 'base64' });
        
        // Verify file was created successfully
        if (!fs.existsSync(filePath)) {
          throw new Error('Failed to write audio file');
        }
        
        const fileStats = fs.statSync(filePath);
        console.log(`File saved: ${filePath}, size: ${fileStats.size} bytes`);
        
        // Use absolute URL for audioUrl
        const host = req.get('host');
        const protocol = req.protocol;
        const fullAudioUrl = `${protocol}://${host}/uploads/${fileName}`;
        
        processedResponses.push({
          questionId,
          audioUrl: fullAudioUrl // Use full URL instead of relative path
        });
      } catch (fileError) {
        console.error('Error saving audio file:', fileError);
        return res.status(500).json({ message: 'Error saving audio file' });
      }
    }
    
    // Create new exam submission
    const newExam = new Exam({
      student: req.user.id,
      examTemplate: examTemplateId,
      responses: processedResponses
    });
    
    await newExam.save();
    
    // Update user's exams list if the User model has exams field
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $push: { exams: newExam._id }
      });
    } catch (err) {
      console.log("Warning: Could not update user's exams list:", err);
      // Continue even if this fails
    }
    
    res.status(201).json(newExam);
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's exams
exports.getUserExams = async (req, res) => {
  try {
    const exams = await Exam.find({ student: req.user.id })
      .populate('examTemplate', 'title')
      .sort({ submittedAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Get my exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific exam details
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('examTemplate')
      .populate('student', 'firstName lastName username');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if user is authorized (student who took exam or admin)
    if (exam.student._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Evaluate exam (admin only)
exports.evaluateExam = async (req, res) => {
  try {
    const { feedback, totalScore } = req.body;
    
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    exam.feedback = feedback;
    exam.totalScore = totalScore;
    exam.status = 'evaluated';
    exam.evaluatedAt = Date.now();
    
    await exam.save();
    
    // Update user's average score
    const user = await User.findById(exam.student);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userExams = await Exam.find({ 
      student: exam.student, 
      status: 'evaluated' 
    });
    
    const totalExams = userExams.length;
    const totalScores = userExams.reduce((sum, exam) => sum + exam.totalScore, 0);
    const averageScore = totalExams > 0 ? totalScores / totalExams : 0;
    
    // Update user average score if the field exists
    if ('averageScore' in user) {
      user.averageScore = averageScore;
      await user.save();
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Evaluate exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all exams (admin only)
exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('examTemplate', 'title')
      .populate('student', 'firstName lastName username')
      .sort({ submittedAt: -1 });
    
    res.json(exams);
  } catch (error) {
    console.error('Get all exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an exam (admin only)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Delete associated audio files
    for (const response of exam.responses) {
      // Extract filename from URL - handle both relative and absolute URLs
      const fileName = response.audioUrl.includes('/') 
        ? response.audioUrl.split('/').pop() 
        : response.audioUrl;
        
      const filePath = path.join(__dirname, '../uploads', fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted audio file: ${filePath}`);
      } else {
        console.log(`Audio file not found: ${filePath}`);
      }
    }
    
    // Changed from exam.remove() to findByIdAndDelete
    await Exam.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
