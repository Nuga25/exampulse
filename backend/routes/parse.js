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
      This is a Nigerian university examination timetable document.
      Extract all exam records and return ONLY a valid JSON array with no markdown, no backticks, no explanation:
      [
        {
          "courseCode": "e.g. CSC401",
          "courseTitle": "full course title",
          "date": "YYYY-MM-DD format",
          "startTime": "HH:MM in 24hr format",
          "endTime": "HH:MM in 24hr format or empty string if not available",
          "venue": "exam hall or venue",
          "department": "department name",
          "level": "level as number e.g. 400"
        }
      ]
      If any field is not available, use an empty string.
      Return only the JSON array. No other text.
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
      ]
    });

    const text = result.text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse timetable. Please try again.' });
  }
});

module.exports = router;