const mongoose = require('mongoose');

// Schema lar va modellar
const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['text', 'image', 'table'],
    default: 'text'
  },
  imageUrl: String,
  tableData: {
    topic: String,
    columns: [String],
    rows: [[String]]
  },
  part: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  }
});

const ExamTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [QuestionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Yangilangan Answer sxemasi - to'liq ma'lumotlarni saqlash
const AnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamQuestion'  // ExamTemplate-dagi Question ga reference
  },
  questionData: {
    question: String,
    questionType: {
      type: String,
      enum: ['text', 'image', 'table'],
      default: 'text'
    }, 
    imageUrl: String,
    tableData: {
      topic: String,
      columns: [String],
      rows: [[String]]
    },
    part: Number
  },
  audioUrl: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  feedback: String
});

// Eski Response sxemasini saqlab qolish
const ResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  }
});

const FeedbackSchema = new mongoose.Schema({
  part: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  score: {
    type: Number,
    required: true
  },
  feedback: String
});

const ExamSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamTemplate',
    required: true
  },
  // Ikkala ma'lumot turini saqlab qolish
  responses: [ResponseSchema], // Eskirgan format
  answers: [AnswerSchema],     // Yangi format
  feedback: [FeedbackSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'evaluated'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  evaluatedAt: Date
});

// Question o'zining modeli bilan
const ExamQuestion = mongoose.model('ExamQuestion', QuestionSchema);
const ExamTemplate = mongoose.model('ExamTemplate', ExamTemplateSchema);
const Exam = mongoose.model('Exam', ExamSchema);

module.exports = { ExamTemplate, Exam, ExamQuestion };
