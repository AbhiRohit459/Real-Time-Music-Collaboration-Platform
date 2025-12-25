const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  note: { type: String, required: true }, // e.g., "C4", "E4"
  velocity: { type: Number, default: 100 },
  startTime: { type: Number, required: true }, // in beats
  duration: { type: Number, required: true }, // in beats
  channel: { type: Number, default: 0 }
});

const TrackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  instrument: { type: String, default: 'piano' },
  volume: { type: Number, default: 0.7 },
  pan: { type: Number, default: 0 },
  notes: [NoteSchema],
  color: { type: String, default: '#4CAF50' }
});

const VersionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  tracks: [TrackSchema],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  bpm: { type: Number, default: 120 },
  timeSignature: { type: String, default: '4/4' },
  tracks: [TrackSchema],
  versions: [VersionSchema],
  collaborators: [{ type: String }],
  owner: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);

