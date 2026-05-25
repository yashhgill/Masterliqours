const express = require('express');
const router = express.Router();
const { requireAuth } = require('../services/authTokens');
const { syncOperationsToGoogleSheets } = require('../services/googleSheets');

router.post('/sheets/sync', requireAuth, async (req, res) => {
  try {
    const result = await syncOperationsToGoogleSheets(req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
