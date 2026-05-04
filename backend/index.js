const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialise Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ExamPulse backend is running' });
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    const db = admin.database();
    await db.ref('connection_test').set({
      status: 'connected',
      timestamp: new Date().toISOString()
    });
    res.json({ message: 'Firebase connection successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes (we will uncomment these soon)
// app.use('/api/exams', require('./routes/exams'));
// app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ExamPulse backend running on port ${PORT}`);
});