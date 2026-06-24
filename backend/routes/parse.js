const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/course-form', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'No PDF data provided' });

    const prompt = `
      This is a Nigerian university course registration form.
      Extract the following information and return ONLY a valid JSON object with no markdown, no backticks, no explanation:
      {
        "studentName": "full name of student",
        "matricNumber": "matriculation number",
        "department": "department name",
        "level": "level as a number e.g. 400",
        "semester": "semester e.g. First Semester",
        "session": "academic session e.g. 2025/2026",
        "courses": [
          {
            "courseCode": "e.g. CSC401",
            "courseTitle": "full course title",
            "units": 3,
            "status": "C or E"
          }
        ]
      }
      Return only the JSON. No other text.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }
          ]
        }
      ]
    });

    const text = result.text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse document. Please try again.' });
  }
});

router.post('/exam-timetable', async (req, res) => {
  try {
    const { pdfBase64, mimeType } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'No file data provided' });

    const prompt = `
      For each course found, return a JSON object with these exact fields:
      - courseCode: the course code without spaces e.g. CSC429
      - courseTitle: empty string
      - date: the date in YYYY-MM-DD format, the year should always be the current year(for example, if the form says 2025/2026 academic session, the year used should be 2026)
      - startTime: in HH:MM 24hr format. Time columns are: first column=08:00, second column=11:30, third column=15:00
      - endTime: first column=11:00, second column=14:30, third column=18:00
      - venue: the venue text in brackets after the course code
      - department: the department name
      - level: just the number e.g. 400

      IMPORTANT: Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Start your response with [ and end with ]
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'application/pdf', data: pdfBase64 } }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 32768,
        temperature: 0.1,
      },
    });

    let text = result.text.trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const startIndex = text.indexOf('[');
    if (startIndex === -1) {
    return res.status(500).json({ error: 'AI did not return a valid JSON array. Please try again.' });
    }

    let jsonStr = text.slice(startIndex);

    // If the array is not closed, close it
    if (!jsonStr.trimEnd().endsWith(']')) {
    console.log('Response was truncated — attempting recovery...');
    const lastComplete = jsonStr.lastIndexOf('},');
    if (lastComplete !== -1) {
        jsonStr = jsonStr.slice(0, lastComplete + 1) + ']';
        console.log('Recovery successful');
    } else {
        return res.status(500).json({ error: 'Response too large. Try uploading fewer pages.' });
    }
    }

    let parsed;
    try {
    parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
    return res.status(500).json({ error: 'Could not parse AI response. Please try again.' });
    }

    res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse timetable.' });
  }
});

router.post('/save-bulk', async (req, res) => {
  try {
    const { exams } = req.body;
    if (!exams || exams.length === 0) {
      return res.status(400).json({ error: 'No exams provided' });
    }

    const admin = require('firebase-admin');
    const db = admin.database();

    // Save all exams
    const savedExams = [];
    for (const exam of exams) {
      const newRef = db.ref('exams').push();
      await newRef.set({
        ...exam,
        courseCode: exam.courseCode.toUpperCase(),
        createdAt: new Date().toISOString(),
        bulkImport: true, 
      });
      savedExams.push({ id: newRef.key, ...exam });
    }

    // Send ONE summary notification instead of one per exam
    const usersSnapshot = await db.ref('users').get();
    if (usersSnapshot.exists()) {
      const tokens = [];
      const studentIds = [];

      usersSnapshot.forEach((child) => {
        const user = child.val();
        if (user.role !== 'student' || !user.fcmToken) return;

        const registeredCodes = (user.courses || []).map(c =>
          c.courseCode.replace(/\s/g, '').toUpperCase()
        );

        // Check if student has ANY of the uploaded exams
        const hasAny = savedExams.some(exam =>
          registeredCodes.includes(exam.courseCode.replace(/\s/g, '').toUpperCase())
        );

        if (hasAny) {
          tokens.push(user.fcmToken);
          studentIds.push(child.key);
        }
      });

      if (tokens.length > 0) {
        const messages = tokens.map(token => ({
          to: token,
          title: '📅 Exam Timetable Published',
          body: `${savedExams.length} exam${savedExams.length > 1 ? 's have' : ' has'} been scheduled. Open ExamPulse to view your timetable.`,
          data: { type: 'bulk_import', count: savedExams.length },
          sound: 'default',
          priority: 'high',
        }));

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        });

        // Log one notification per student
        const timestamp = new Date().toISOString();
        for (const studentId of studentIds) {
          const notifRef = db.ref(`notifications/${studentId}`).push();
          await notifRef.set({
            title: '📅 Exam Timetable Published',
            body: `${savedExams.length} exam${savedExams.length > 1 ? 's have' : ' has'} been scheduled. Open ExamPulse to view your timetable.`,
            examData: null,
            timestamp,
            read: false,
          });
        }

        console.log(`Bulk notification sent to ${tokens.length} students`);
      }
    }

    res.json({ success: true, count: savedExams.length });

  } catch (error) {
    console.error('Bulk save error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;