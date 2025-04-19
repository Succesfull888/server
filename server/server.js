require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
// ... other routes ...

const app = express();

//---- Middleware
app.use(cors({
  origin: [
    'https://new-cefr-exam.vercel.app',
    'https://new-cefr-exam-p2j2.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//---- Mongoose connection
// Atlas'dan olingan URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://cefrexamadmin:Admin123@cefr-speaking-exam.1tb2ysd.mongodb.net/cefr_db?retryWrites=true&w=majority";

// Xavfsizlik uchun URI ni logga yozish vaqtida parolni yashirish
const uriForLog = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log('Attempting to connect to MongoDB with URI:', uriForLog);

// Debug rejimini yoqish
mongoose.set('debug', (collectionName, methodName, ...args) => {
  console.log(`Mongoose: ${collectionName}.${methodName}`, ...args);
});

// Buffer buyruqlarini o'chirish - ulangan bo'lmaguncha
mongoose.set('bufferCommands', false);

// MongoDB ga ulanish
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Connection retry settings
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  // Connection keepalive
  keepAlive: true,
  keepAliveInitialDelay: 300000 // 5 minutes
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`✅ Connected to database: ${mongoose.connection.name}`);
  
  // Only start the server once Mongo is up
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  
  // More detailed error info for MongoDB errors
  if (err.name === 'MongoServerError') {
    console.error('❌ Code:', err.code);
    console.error('❌ CodeName:', err.codeName);
  }
  
  console.error('❌ Stack trace:', err.stack);
  
  // Exit with error code so Render will restart
  process.exit(1);
});

//---- Mongoose connection events
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('error', err => console.error('⚠️  MongoDB error:', err));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected event fired'));

//---- Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
// ... other routes ...

//---- Health endpoint for status checks
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[mongoStatus];
  
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      status: statusText,
      readyState: mongoStatus,
      database: mongoose.connection.name
    }
  });
});

//---- 404 Not Found handler
app.use((req, res) =>
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found',
    path: req.originalUrl
  })
);

//---- Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Export for testing purposes
module.exports = app;
