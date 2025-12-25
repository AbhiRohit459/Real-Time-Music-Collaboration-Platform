const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');
const Project = require('../models/Project');

// Export project to MIDI
router.post('/midi/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const midiBuffer = await exportService.exportToMIDI(project);
    res.setHeader('Content-Type', 'audio/midi');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.mid"`);
    res.send(midiBuffer);
  } catch (error) {
    console.error('MIDI export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export project to WAV
router.post('/wav/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const wavPath = await exportService.exportToWAV(project);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(wavPath)) {
      return res.status(500).json({ error: 'WAV file was not created successfully' });
    }

    // Send file with proper headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(project.name || 'project')}.wav"`);
    
    const fileStream = fs.createReadStream(wavPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read WAV file' });
      }
    });
  } catch (error) {
    console.error('WAV export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'WAV export failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Export project to MP3
router.post('/mp3/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const mp3Path = await exportService.exportToMP3(project);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(mp3Path)) {
      return res.status(500).json({ error: 'MP3 file was not created successfully' });
    }

    // Send file with proper headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(project.name || 'project')}.mp3"`);
    
    const fileStream = fs.createReadStream(mp3Path);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      // Clean up file after sending (optional, or keep for caching)
      // fs.unlinkSync(mp3Path);
    });
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read MP3 file' });
      }
    });
  } catch (error) {
    console.error('MP3 export error:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure we send JSON, not blob, for errors
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'MP3 export failed',
        message: error.message || 'MP3 export failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      // If headers already sent, try to end the response
      try {
        res.end();
      } catch (e) {
        console.error('Error ending response:', e);
      }
    }
  }
});

module.exports = router;

