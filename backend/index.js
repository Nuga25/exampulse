const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ExamPulse backend is running' });
});

// Routes (we will add these soon)
// app.use('/api/exams', require('./routes/exams'));
// app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ExamPulse backend running on port ${PORT}`);
});