const { Router } = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { callSpeechSTT, callSpeechTTS } = require('../services/aiProviders');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.post('/stt', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioBase64 = req.file.buffer.toString('base64');
    const orgConfig = { speechProvider: req.orgConfig?.speechProvider };
    const text = await callSpeechSTT(audioBase64, orgConfig);

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tts', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const orgConfig = { speechProvider: req.orgConfig?.speechProvider };
    const audioBase64 = await callSpeechTTS(text, orgConfig);

    if (!audioBase64) {
      return res.status(500).json({ error: 'TTS returned no audio' });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    res.set('Content-Type', 'audio/wav');
    res.send(audioBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
