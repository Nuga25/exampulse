const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database();

// GET notifications for a student
router.get('/:userId', async (req, res) => {
  try {
    const snapshot = await db.ref(`notifications/${req.params.userId}`).get();
    if (!snapshot.exists()) return res.json([]);
    const notifs = Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }));
    res.json(notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK notification as read
router.patch('/:userId/:notifId', async (req, res) => {
  try {
    await db.ref(`notifications/${req.params.userId}/${req.params.notifId}`).update({ read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;