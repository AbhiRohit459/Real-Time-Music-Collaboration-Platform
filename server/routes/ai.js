const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

// Get harmony suggestions
router.post('/harmony', async (req, res) => {
  try {
    const { notes, context, style } = req.body;
    const suggestions = await aiService.suggestHarmony(notes, context, style);
    res.json(suggestions);
  } catch (error) {
    console.error('AI harmony error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chord progression suggestions
router.post('/chords', async (req, res) => {
  try {
    const { currentChords, key, style } = req.body;
    const suggestions = await aiService.suggestChordProgression(currentChords, key, style);
    res.json(suggestions);
  } catch (error) {
    console.error('AI chord error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get melody variations
router.post('/melody', async (req, res) => {
  try {
    const { melody, context, variations } = req.body;
    const suggestions = await aiService.suggestMelodyVariations(melody, context, variations);
    res.json(suggestions);
  } catch (error) {
    console.error('AI melody error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

