const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const db = admin.database();

const cron = require('node-cron');

// ─── REMINDER NOTIFICATIONS ───────────────────────────────────────
const sendReminderNotifications = async (hoursBeforeExam, label) => {
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursBeforeExam * 60 * 60 * 1000);

    // Get all exams
    const examsSnapshot = await db.ref('exams').get();
    if (!examsSnapshot.exists()) return;

    const exams = [];
    examsSnapshot.forEach((child) => {
      const exam = child.val();
      const examDateTime = new Date(`${exam.date}T${exam.startTime}`);

      // Check if this exam falls within a 15-minute window around our target time
      const diff = Math.abs(examDateTime - targetTime);
      if (diff <= 15 * 60 * 1000) {
        exams.push({ id: child.key, ...exam });
      }
    });

    if (exams.length === 0) return;

    console.log(`Sending ${label} reminders for ${exams.length} exam(s)...`);

    for (const exam of exams) {
      await sendNotificationToStudents(
        exam.courseCode,
        `⏰ Exam Reminder — ${label}`,
        `${exam.courseCode} — ${exam.courseTitle} starts in ${label} at ${exam.startTime}, ${exam.venue}`,
        { examId: exam.id, ...exam }
      );
    }
  } catch (error) {
    console.error('Reminder error:', error);
  }
};

// Run every 15 minutes and check for upcoming exams
cron.schedule('*/15 * * * *', async () => {
  await sendReminderNotifications(24, '24 hours');
  await sendReminderNotifications(2, '2 hours');
});

console.log('Reminder scheduler running — checking every 15 minutes');

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ExamPulse backend is running' });
});

// ─── NOTIFICATION SENDER ───────────────────────────────────────────
const sendNotificationToStudents = async (courseCode, title, body, examData) => {
  try {
    const usersSnapshot = await db.ref('users').get();
    if (!usersSnapshot.exists()) return;

    const tokens = [];
    const studentIds = [];

    usersSnapshot.forEach((child) => {
      const user = child.val();
      if (user.role !== 'student' || !user.fcmToken) return;

      // Check if student has this course in their registered courses
      const registeredCodes = (user.courses || []).map(c =>
        c.courseCode.replace(/\s/g, '').toUpperCase()
      );

      const examCode = courseCode?.replace(/\s/g, '').toUpperCase();

      // Also keep department/level fallback for students without courses registered
      const hasCourse = registeredCodes.length > 0
        ? registeredCodes.includes(examCode)
        : (
          user.department?.trim().toLowerCase() === examData.department?.trim().toLowerCase() &&
          String(user.level).trim() === String(examData.level).trim()
        );

      if (hasCourse) {
        tokens.push(user.fcmToken);
        studentIds.push(child.key);
      }
    });

    if (tokens.length === 0) {
      console.log('No students found for course:', courseCode);
      return;
    }

    console.log(`Sending notifications to ${tokens.length} student(s) for ${courseCode}...`);

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

    // Log to database
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

  if (!listenerReady) {
    knownExams[examId] = exam;
    return;
  }

  // Skip exams added via bulk import — they send their own single notification
  if (exam.bulkImport) {
    knownExams[examId] = exam;
    return;
  }

  console.log('New exam detected:', exam.courseCode);

  await sendNotificationToStudents(
    exam.courseCode,
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
    exam.courseCode,
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
    exam.courseCode,
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