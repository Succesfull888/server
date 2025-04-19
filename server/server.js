require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
// … other routes …

const app = express();

//–– Middleware
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

//–– Mongoose connection
mongoose.set('bufferCommands', false); 
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected');
  
  //–– Only start the server once Mongo is up
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV})`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);      // Fail hard so Render will restart the service
});

//–– Optional: verbose connection events
mongoose.connection.on('disconnected', () => console.warn('⚠️  Mongo disconnected'));
mongoose.connection.on('error', err => console.error('⚠️  Mongo error:', err));

//–– Routes (these won’t be hit until after the above `connect.then`)
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
// … other routes …

//–– Health & 404 & Global Error Handler
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: Date.now() })
);

app.use((req, res) =>
  res.status(404).json({ status: 'error', message: 'Route not found' })
);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});
