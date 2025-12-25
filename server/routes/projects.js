const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');

// Helper to check MongoDB connection
const checkConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database not connected', 
      readyState: mongoose.connection.readyState,
      message: 'Please wait for MongoDB connection to be established'
    });
  }
  next();
};

// Get all projects
router.get('/', checkConnection, async (req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project by ID
router.get('/:id', checkConnection, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', checkConnection, async (req, res) => {
  try {
    const { name, description, owner, bpm, timeSignature } = req.body;
    const project = new Project({
      name,
      description: description || '',
      owner: owner || 'anonymous',
      bpm: bpm || 120,
      timeSignature: timeSignature || '4/4',
      tracks: [],
      versions: []
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { tracks, bpm, timeSignature, name, description } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (tracks !== undefined) project.tracks = tracks;
    if (bpm !== undefined) project.bpm = bpm;
    if (timeSignature !== undefined) project.timeSignature = timeSignature;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save version
router.post('/:id/versions', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const versionNumber = project.versions.length + 1;
    const version = {
      version: versionNumber,
      tracks: JSON.parse(JSON.stringify(project.tracks)),
      createdAt: new Date(),
      createdBy: req.body.createdBy || 'anonymous'
    };

    project.versions.push(version);
    await project.save();
    res.json(version);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get versions
router.get('/:id/versions', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

