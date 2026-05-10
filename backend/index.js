const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const db = admin.database();

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ExamPulse backend is running' });
});

// ─── NOTIFICATION SENDER ───────────────────────────────────────────
const sendNotificationToStudents = async (department, level, title, body, examData) => {
  try {
    // Get all users
    const usersSnapshot = await db.ref('users').get();
    if (!usersSnapshot.exists()) return;

    const tokens = [];
    const studentIds = [];

    usersSnapshot.forEach((child) => {
      const user = child.val();
      if (
        user.role === 'student' &&
        user.fcmToken &&
        user.department?.trim().toLowerCase() === department?.trim().toLowerCase() &&
        String(user.level).trim() === String(level).trim()
      ) {
        tokens.push(user.fcmToken);
        studentIds.push(child.key);
      }
    });

    if (tokens.length === 0) {
      console.log('No students found for department:', department, 'level:', level);
      return;
    }

    console.log(`Sending notifications to ${tokens.length} student(s)...`);

    // Send via Expo Push API (works with Expo tokens)
    const messages = tokens.map(token => ({
      to: token,
      title,
      body,
      data: examData,
      sound: 'default',
      priority: 'high',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Notification result:', JSON.stringify(result));

    // Log notification to database for each student
    const timestamp = new Date().toISOString();
    for (const studentId of studentIds) {
      const notifRef = db.ref(`notifications/${studentId}`).push();
      await notifRef.set({
        title,
        body,
        examData,
        timestamp,
        read: false,
      });
    }

  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// ─── LISTEN FOR EXAM CHANGES ───────────────────────────────────────
// Track existing exams so we know what is new vs updated
let knownExams = {};
let listenerReady = false;

db.ref('exams').on('child_added', async (snapshot) => {
  const exam = snapshot.val();
  const examId = snapshot.key;

  // Skip exams that already existed when the server started
  if (!listenerReady) {
    knownExams[examId] = exam;
    return;
  }

  console.log('New exam detected:', exam.courseCode);

  await sendNotificationToStudents(
    exam.department,
    exam.level,
    '📅 New Exam Scheduled',
    `${exam.courseCode} — ${exam.courseTitle} on ${exam.date} at ${exam.startTime}, ${exam.venue}`,
    { examId, ...exam }
  );

  knownExams[examId] = exam;
});

db.ref('exams').on('child_changed', async (snapshot) => {
  if (!listenerReady) return;

  const exam = snapshot.val();
  const examId = snapshot.key;

  console.log('Exam updated:', exam.courseCode);

  await sendNotificationToStudents(
    exam.department,
    exam.level,
    '✏️ Exam Updated',
    `${exam.courseCode} — ${exam.courseTitle} has been updated. Check your timetable.`,
    { examId, ...exam }
  );

  knownExams[examId] = exam;
});

db.ref('exams').on('child_removed', async (snapshot) => {
  if (!listenerReady) return;

  const exam = snapshot.val();
  console.log('Exam removed:', exam.courseCode);

  await sendNotificationToStudents(
    exam.department,
    exam.level,
    '🗑️ Exam Cancelled',
    `${exam.courseCode} — ${exam.courseTitle} has been cancelled.`,
    { examId: snapshot.key, ...exam }
  );
});

// Mark listener as ready after initial load
db.ref('exams').once('value', () => {
  listenerReady = true;
  console.log('Exam listener ready — watching for changes...');
});

// ─── ROUTES ───────────────────────────────────────────────────────
app.use('/api/exams', require('./routes/exams'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/parse', require('./routes/parse'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ExamPulse backend running on port ${PORT}`);
});