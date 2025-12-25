const MidiWriter = require('midi-writer-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Helper to convert note name to MIDI number
function noteToMidiNumber(note) {
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const match = note.match(/([A-G][#b]?)(\d+)/);
  if (!match) return 60; // Default to C4
  
  const [, noteName, octave] = match;
  return noteMap[noteName] + (parseInt(octave) + 1) * 12;
}

// Convert beats to ticks (assuming 480 ticks per quarter note)
function beatsToTicks(beats, bpm) {
  const quarterNotesPerBeat = 1; // Assuming 1 beat = 1 quarter note
  const ticksPerQuarterNote = 480;
  const secondsPerBeat = 60 / bpm;
  const ticksPerBeat = ticksPerQuarterNote * quarterNotesPerBeat;
  return Math.round(beats * ticksPerBeat);
}

async function exportToMIDI(project) {
  const tracks = [];
  
  // Create a tempo track
  const tempoTrack = new MidiWriter.Track();
  tempoTrack.setTempo(project.bpm || 120);
  tracks.push(tempoTrack);
  
  // Create a track for each project track
  project.tracks.forEach((trackData, trackIndex) => {
    const midiTrack = new MidiWriter.Track();
    
    const events = [];
    
    trackData.notes.forEach(note => {
      const midiNote = noteToMidiNumber(note.note);
      const startTick = beatsToTicks(note.startTime, project.bpm || 120);
      const durationTicks = beatsToTicks(note.duration, project.bpm || 120);
      
      // Convert ticks to note duration format
      // midi-writer-js uses note names like '4' for quarter note
      // We'll use ticks directly
      const durationInBeats = note.duration;
      let duration;
      if (durationInBeats <= 0.25) {
        duration = '16'; // sixteenth note
      } else if (durationInBeats <= 0.5) {
        duration = '8'; // eighth note
      } else if (durationInBeats <= 1) {
        duration = '4'; // quarter note
      } else if (durationInBeats <= 2) {
        duration = '2'; // half note
      } else {
        duration = '1'; // whole note
      }
      
      events.push({
        pitch: [midiNote],
        startTick: startTick,
        duration: duration,
        velocity: note.velocity || 100
      });
    });
    
    // Sort events by start time
    events.sort((a, b) => a.startTick - b.startTick);
    
    // Add events to track
    events.forEach(event => {
      // Calculate start time in ticks relative to track start
      const startTime = `T${event.startTick}`;
      midiTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: event.pitch,
        duration: event.duration,
        velocity: event.velocity
      }));
    });
    
    tracks.push(midiTrack);
  });
  
  // If no tracks with notes, create at least one empty track
  if (tracks.length === 1) {
    tracks.push(new MidiWriter.Track());
  }
  
  const write = new MidiWriter.Writer(tracks);
  return Buffer.from(write.buildFile());
}

async function exportToWAV(project) {
  const exportsDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  // First export to MIDI
  const midiBuffer = await exportToMIDI(project);
  const midiPath = path.join(exportsDir, `${project._id}_temp.mid`);
  fs.writeFileSync(midiPath, midiBuffer);
  
  // Convert MIDI to WAV using FluidSynth
  // This requires FluidSynth and a soundfont to be installed
  const wavPath = path.join(exportsDir, `${project._id}.wav`);
  
  try {
    // Try to use FluidSynth if available
    // Note: You may need to specify a soundfont file
    // Example: fluidsynth -F output.wav -i input.mid /path/to/soundfont.sf2
    const soundfontPath = process.env.SOUNDFONT_PATH || '/usr/share/sounds/sf2/FluidR3_GM.sf2';
    
    // Check if soundfont exists, if not try without it
    let command;
    if (fs.existsSync(soundfontPath)) {
      command = `fluidsynth -F "${wavPath}" -i "${midiPath}" "${soundfontPath}"`;
    } else {
      // Try without soundfont (may not work, but worth trying)
      command = `fluidsynth -F "${wavPath}" -i "${midiPath}"`;
    }
    
    await execPromise(command);
  } catch (error) {
    // Clean up temp MIDI file
    if (fs.existsSync(midiPath)) {
      fs.unlinkSync(midiPath);
    }
    console.error('FluidSynth error:', error);
    throw new Error('WAV export requires FluidSynth and a soundfont. Please install them or use MIDI export.');
  }
  
  // Clean up temp MIDI file
  if (fs.existsSync(midiPath)) {
    fs.unlinkSync(midiPath);
  }
  
  return wavPath;
}

async function exportToMP3(project) {
  const exportsDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  // First export to WAV
  let wavPath;
  try {
    wavPath = await exportToWAV(project);
  } catch (error) {
    throw new Error(`Failed to create WAV file: ${error.message}`);
  }

  if (!wavPath || !fs.existsSync(wavPath)) {
    throw new Error('WAV file was not created successfully');
  }

  const mp3Path = path.join(exportsDir, `${project._id}.mp3`);
  
  try {
    // Check if ffmpeg is available
    try {
      await execPromise('ffmpeg -version');
    } catch (checkError) {
      // Clean up WAV file
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
      throw new Error('FFmpeg is not installed or not available in PATH. Please install FFmpeg to export MP3 files.');
    }

    // Convert WAV to MP3 using ffmpeg
    // Use -y flag to overwrite existing file, -loglevel error to reduce noise
    await execPromise(`ffmpeg -y -loglevel error -i "${wavPath}" -codec:a libmp3lame -b:a 192k "${mp3Path}"`);
    
    // Verify MP3 was created
    if (!fs.existsSync(mp3Path)) {
      throw new Error('MP3 file was not created by FFmpeg');
    }
    
    // Clean up WAV file
    if (fs.existsSync(wavPath)) {
      fs.unlinkSync(wavPath);
    }
  } catch (error) {
    // Clean up WAV file on error
    if (wavPath && fs.existsSync(wavPath)) {
      try {
        fs.unlinkSync(wavPath);
      } catch (cleanupError) {
        console.error('Error cleaning up WAV file:', cleanupError);
      }
    }
    
    // Clean up partial MP3 file if it exists
    if (fs.existsSync(mp3Path)) {
      try {
        fs.unlinkSync(mp3Path);
      } catch (cleanupError) {
        console.error('Error cleaning up MP3 file:', cleanupError);
      }
    }
    
    console.error('FFmpeg conversion error:', error);
    throw new Error(`MP3 export failed: ${error.message || 'FFmpeg conversion error'}`);
  }
  
  return mp3Path;
}

module.exports = {
  exportToMIDI,
  exportToWAV,
  exportToMP3
};

