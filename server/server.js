const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();

// Middleware
// server.js yoki app.js faylida

app.use(cors({
  origin: [
    'https://new-cefr-exam.vercel.app',
    'https://new-cefr-exam-p2j2.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // Эслатма: Индексни бир марта ўчириб олганингиздан кейин бу қисмни ўчириб ташланг
    // try {
    //   mongoose.connection.db.collection('users').dropIndex('login_1');
    //   console.log('Successfully dropped login_1 index');
    // } catch (err) {
    //   console.log('Error dropping index or index doesn\'t exist:', err.message);
    // }
  })
  .catch(err => console.log('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Production mode - serve static files from client/build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle client routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Development mode
  // Base endpoint to provide API information
  app.get('/', (req, res) => {
    res.json({
      message: 'CEFR Speaking Exam Platform API is running',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        exams: '/api/exams',
        users: '/api/users',
        admin: '/api/admin',
        health: '/api/health'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

// 404 handler - must be after all other routes
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred on the server',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`===================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at: http://localhost:${PORT}/`);
  console.log(`===================================`);
});
