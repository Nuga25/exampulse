const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database();

// GET all exams
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('exams').get();
    if (!snapshot.exists()) return res.json([]);
    const exams = Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }));
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;