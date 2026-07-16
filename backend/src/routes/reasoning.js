const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { callReasoning } = require('../services/aiProviders');

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const orgConfig = req.orgConfig || {};
    const result = await callReasoning([
      { role: 'system', content: 'You are the DESKA AI assistant. Respond with JSON: {"intent":"...","language":"' + (language || 'en') + '","spoken_response":"..."}' },
      { role: 'user', content: text },
    ], orgConfig);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
