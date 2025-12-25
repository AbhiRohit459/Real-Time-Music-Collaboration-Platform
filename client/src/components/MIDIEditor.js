import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as Tone from 'tone';
import io from 'socket.io-client';
import api from '../config/api';
import './MIDIEditor.css';
import TrackList from './TrackList';
import PianoRoll from './PianoRoll';
import PlaybackControls from './PlaybackControls';
import AIPanel from './AIPanel';

function MIDIEditor({ project, onBack, onProjectUpdate }) {
  const [tracks, setTracks] = useState(project.tracks || []);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [bpm, setBpm] = useState(project.bpm || 120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [collaborators, setCollaborators] = useState(0);
  const [socket, setSocket] = useState(null);
  const [synths, setSynths] = useState({});
  const [transport, setTransport] = useState(null);
  const transportRef = useRef(null);
  const scheduleRef = useRef([]);
  const saveTimeoutRef = useRef(null);

  // Helper to safely set Transport BPM (only if AudioContext is running)
  const setTransportBpm = (newBpm) => {
    try {
      if (Tone.context && Tone.context.state === 'running' && Tone.Transport) {
        Tone.Transport.bpm.value = newBpm;
      }
    } catch (e) {
      // Ignore errors if Transport isn't ready
    }
  };

  useEffect(() => {
    // Don't access Tone.Transport properties here - it initializes AudioContext
    // Transport will be initialized on first user interaction
    setTransport(Tone.Transport);

    // Initialize Socket.io
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    newSocket.emit('join-project', project._id);

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data);
    });

    newSocket.on('user-left', (data) => {
      console.log('User left:', data);
    });

    newSocket.on('room-update', (data) => {
      setCollaborators(data.userCount);
    });

    newSocket.on('note-added', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteNoteAdded(data);
      }
    });

    newSocket.on('note-updated', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteNoteUpdated(data);
      }
    });

    newSocket.on('note-deleted', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteNoteDeleted(data);
      }
    });

    newSocket.on('track-added', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteTrackAdded(data);
      }
    });

    newSocket.on('track-updated', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteTrackUpdated(data);
      }
    });

    newSocket.on('track-deleted', (data) => {
      if (data.userId !== newSocket.id) {
        handleRemoteTrackDeleted(data);
      }
    });

    newSocket.on('playback-state', (data) => {
      if (data.userId !== newSocket.id) {
        if (data.isPlaying) {
          // Don't start AudioContext automatically - it must be started by user gesture
          // Only start Transport if AudioContext is already running
          if (Tone.context.state === 'running') {
            Tone.Transport.start();
          }
        } else {
          Tone.Transport.stop();
        }
        setCurrentTime(data.currentTime);
      }
    });

    newSocket.on('project-settings-changed', (data) => {
      if (data.userId !== newSocket.id) {
        if (data.settings.bpm) {
          setBpm(data.settings.bpm);
          // Only set Transport BPM if AudioContext is already running
          setTransportBpm(data.settings.bpm);
        }
      }
    });

    setSocket(newSocket);

    // Load project tracks
    loadTracks();

    return () => {
      newSocket.emit('leave-project', project._id);
      newSocket.disconnect();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Object.values(synths).forEach(synth => synth.dispose());
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project._id]);

  const loadTracks = async () => {
    try {
      if (!project || !project._id) {
        console.warn('Cannot load tracks: project ID missing');
        return;
      }
      const response = await api.get(`/api/projects/${project._id}`);
      if (response.data && Array.isArray(response.data.tracks)) {
        setTracks(response.data.tracks);
      } else {
        setTracks([]);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      setTracks([]);
    }
  };

  const handleRemoteNoteAdded = (data) => {
    if (!data || !data.trackId || !data.note) return;
    setTracks(prev => prev.map(track => {
      if (track && (track._id === data.trackId || track.id === data.trackId)) {
        return { ...track, notes: [...(track.notes || []), data.note] };
      }
      return track;
    }));
  };

  const handleRemoteNoteUpdated = (data) => {
    if (!data || !data.trackId || !data.noteId) return;
    setTracks(prev => prev.map(track => {
      if (track && (track._id === data.trackId || track.id === data.trackId)) {
        return {
          ...track,
          notes: (track.notes || []).map(note =>
            note && (note.id === data.noteId || note._id === data.noteId) ? { ...note, ...data.note } : note
          )
        };
      }
      return track;
    }));
  };

  const handleRemoteNoteDeleted = (data) => {
    if (!data || !data.trackId || !data.noteId) return;
    setTracks(prev => prev.map(track => {
      if (track && (track._id === data.trackId || track.id === data.trackId)) {
        return {
          ...track,
          notes: (track.notes || []).filter(note => note && note.id !== data.noteId && note._id !== data.noteId)
        };
      }
      return track;
    }));
  };

  const handleRemoteTrackAdded = (data) => {
    if (!data || !data.track) return;
    setTracks(prev => [...prev, data.track]);
  };

  const handleRemoteTrackUpdated = (data) => {
    if (!data || !data.trackId || !data.updates) return;
    setTracks(prev => prev.map(track =>
      track && (track._id === data.trackId || track.id === data.trackId)
        ? { ...track, ...data.updates }
        : track
    ));
  };

  const handleRemoteTrackDeleted = (data) => {
    if (!data || !data.trackId) return;
    setTracks(prev => prev.filter(track =>
      track && track._id !== data.trackId && track.id !== data.trackId
    ));
  };

  const saveProject = async () => {
    try {
      if (!project || !project._id) {
        console.warn('Cannot save: project ID missing');
        return;
      }

      // Ensure tracks is an array and clean up any invalid data
      const tracksToSave = Array.isArray(tracks) ? tracks.map((track, index) => {
        if (!track) return null;
        // Ensure required fields are present
        const cleanedTrack = {
          name: track.name || `Track ${index + 1}`,
          instrument: track.instrument || 'piano',
          volume: typeof track.volume === 'number' ? Math.max(0, Math.min(1, track.volume)) : 0.7,
          pan: typeof track.pan === 'number' ? Math.max(-1, Math.min(1, track.pan)) : 0,
          color: track.color || `hsl(${(index * 60) % 360}, 70%, 50%)`,
          notes: Array.isArray(track.notes) ? track.notes
            .filter(note => note && note.note && typeof note.startTime === 'number' && typeof note.duration === 'number')
            .map(note => ({
              note: String(note.note),
              velocity: typeof note.velocity === 'number' ? Math.max(0, Math.min(127, note.velocity)) : 100,
              startTime: Math.max(0, note.startTime),
              duration: Math.max(0.1, note.duration),
              channel: typeof note.channel === 'number' ? Math.max(0, Math.min(15, note.channel)) : 0
            })) : []
        };
        // Preserve _id if it exists (for MongoDB)
        if (track._id) {
          cleanedTrack._id = track._id;
        }
        return cleanedTrack;
      }).filter(Boolean) : [];
      
      await api.put(`/api/projects/${project._id}`, {
        tracks: tracksToSave,
        bpm: typeof bpm === 'number' && bpm > 0 && bpm <= 300 ? bpm : 120
      });
      onProjectUpdate();
    } catch (error) {
      console.error('Error saving project:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        // Don't alert on every save error to avoid spam
      }
    }
  };

  // Debounced save function - waits 1 second after last change before saving
  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, 1000); // Wait 1 second after last change
  };

  const addTrack = () => {
    const newTrack = {
      id: uuidv4(),
      name: `Track ${(tracks.length || 0) + 1}`,
      instrument: 'piano',
      volume: 0.7,
      pan: 0,
      notes: [],
      color: `hsl(${(tracks.length * 60) % 360}, 70%, 50%)`
    };
    const updatedTracks = [...(tracks || []), newTrack];
    setTracks(updatedTracks);
    
    // Auto-select the new track
    setSelectedTrack(newTrack.id);
    
    if (socket && project && project._id) {
      socket.emit('track-added', {
        projectId: project._id,
        track: newTrack
      });
    }
    
    debouncedSave();
  };

  const updateTrack = (trackId, updates) => {
    if (!trackId || !updates) return;
    
    const updatedTracks = (tracks || []).map(track => {
      if (track && (track.id === trackId || track._id === trackId)) {
        return { ...track, ...updates };
      }
      return track;
    });
    setTracks(updatedTracks);
    
    if (socket && project && project._id) {
      socket.emit('track-updated', {
        projectId: project._id,
        trackId,
        updates
      });
    }
    
    debouncedSave();
  };

  const deleteTrack = (trackId) => {
    if (!trackId) return;
    
    const updatedTracks = (tracks || []).filter(track =>
      track && track.id !== trackId && track._id !== trackId
    );
    setTracks(updatedTracks);
    
    // Clear selection if deleted track was selected
    if (selectedTrack === trackId) {
      setSelectedTrack(null);
    }
    
    if (socket && project && project._id) {
      socket.emit('track-deleted', {
        projectId: project._id,
        trackId
      });
    }
    
    debouncedSave();
  };

  const addNote = (trackId, note) => {
    if (!trackId || !note || !note.note) return;
    
    const noteWithId = { 
      ...note, 
      id: uuidv4(),
      startTime: typeof note.startTime === 'number' ? Math.max(0, note.startTime) : 0,
      duration: typeof note.duration === 'number' ? Math.max(0.1, note.duration) : 0.25,
      velocity: typeof note.velocity === 'number' ? Math.max(0, Math.min(127, note.velocity)) : 100
    };
    
    const updatedTracks = (tracks || []).map(track => {
      if (track && (track.id === trackId || track._id === trackId)) {
        return { ...track, notes: [...(track.notes || []), noteWithId] };
      }
      return track;
    });
    setTracks(updatedTracks);
    
    if (socket && project && project._id) {
      socket.emit('note-added', {
        projectId: project._id,
        trackId,
        note: noteWithId
      });
    }
    
    debouncedSave();
  };

  const updateNote = (trackId, noteId, updates) => {
    if (!trackId || !noteId || !updates) return;
    
    const updatedTracks = (tracks || []).map(track => {
      if (track && (track.id === trackId || track._id === trackId)) {
        return {
          ...track,
          notes: (track.notes || []).map(note =>
            note && (note.id === noteId || note._id === noteId) ? { ...note, ...updates } : note
          )
        };
      }
      return track;
    });
    setTracks(updatedTracks);
    
    if (socket && project && project._id) {
      socket.emit('note-updated', {
        projectId: project._id,
        trackId,
        noteId,
        note: updates
      });
    }
    
    debouncedSave();
  };

  const deleteNote = (trackId, noteId) => {
    if (!trackId || !noteId) return;
    
    const updatedTracks = (tracks || []).map(track => {
      if (track && (track.id === trackId || track._id === trackId)) {
        return {
          ...track,
          notes: (track.notes || []).filter(note => note && note.id !== noteId && note._id !== noteId)
        };
      }
      return track;
    });
    setTracks(updatedTracks);
    
    if (socket && project && project._id) {
      socket.emit('note-deleted', {
        projectId: project._id,
        trackId,
        noteId
      });
    }
    
    debouncedSave();
  };

  const handlePlay = async () => {
    // Start AudioContext on user interaction
    if (!Tone.context.state || Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    // Wait a bit to ensure AudioContext is fully ready
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now it's safe to access Transport properties
    setTransportBpm(bpm);

    // Clear previous schedules
    scheduleRef.current.forEach(id => Tone.Transport.clear(id));
    scheduleRef.current = [];

    // Schedule all notes
    tracks.forEach(track => {
      if (!track || !Array.isArray(track.notes)) return;
      
      track.notes.forEach(note => {
        if (!note || !note.note || note.startTime === undefined || note.duration === undefined) return;
        
        try {
          // Ensure AudioContext is running before creating synths
          if (Tone.context.state !== 'running') {
            console.warn('AudioContext not ready, skipping note');
            return;
          }
          
          const synth = getSynthForTrack(track);
          const startTime = `+${note.startTime * (60 / bpm)}`;
          const duration = note.duration * (60 / bpm);
          
          const id = Tone.Transport.schedule((time) => {
            synth.triggerAttackRelease(
              note.note,
              duration,
              time,
              note.velocity ? note.velocity / 127 : 0.8
            );
          }, startTime);
          
          scheduleRef.current.push(id);
        } catch (error) {
          console.error('Error scheduling note:', error, note);
        }
      });
    });

    Tone.Transport.start();
    setIsPlaying(true);
    
    if (socket) {
      socket.emit('playback-state', {
        projectId: project._id,
        isPlaying: true,
        currentTime: Tone.Transport.seconds
      });
    }
  };

  const handleStop = () => {
    try {
      if (Tone.Transport) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      scheduleRef.current.forEach(id => {
        try {
          Tone.Transport.clear(id);
        } catch (e) {
          // Ignore clear errors
        }
      });
      scheduleRef.current = [];
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (socket && project && project._id) {
        socket.emit('playback-state', {
          projectId: project._id,
          isPlaying: false,
          currentTime: 0
        });
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const getSynthForTrack = (track) => {
    const trackId = track.id || track._id;
    if (!synths[trackId]) {
      // Create PolySynth with proper options
      const synth = new Tone.PolySynth({
        maxPolyphony: 32,
        voice: Tone.Synth
      });
      
      // Connect to destination - try multiple methods
      try {
        if (Tone.Destination && Tone.Destination.input) {
          synth.connect(Tone.Destination);
        } else if (Tone.getDestination && typeof Tone.getDestination === 'function') {
          const destination = Tone.getDestination();
          if (destination) {
            synth.connect(destination);
          }
        } else if (Tone.context && Tone.context.destination) {
          synth.connect(Tone.context.destination);
        } else {
          // Fallback: use toDestination if available
          if (synth.toDestination && typeof synth.toDestination === 'function') {
            synth.toDestination();
          } else {
            console.warn('Could not connect synth to destination');
          }
        }
      } catch (connectError) {
        console.error('Error connecting synth to destination:', connectError);
        // Try toDestination as fallback
        try {
          if (synth.toDestination && typeof synth.toDestination === 'function') {
            synth.toDestination();
          }
        } catch (e) {
          console.error('Fallback connection also failed:', e);
        }
      }
      
      synth.volume.value = Tone.gainToDb(track.volume || 0.7);
      setSynths(prev => ({ ...prev, [trackId]: synth }));
      return synth;
    }
    return synths[trackId];
  };

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    // Only set Transport BPM if AudioContext is already running
    setTransportBpm(newBpm);
    
    if (socket) {
      socket.emit('project-settings-changed', {
        projectId: project._id,
        settings: { bpm: newBpm }
      });
    }
    
    debouncedSave();
  };

  const handleExport = async (format) => {
    try {
      if (!project || !project._id) {
        alert('Cannot export: project ID missing');
        return;
      }

      const hasNotes = tracks.some(track => track && Array.isArray(track.notes) && track.notes.length > 0);
      if (!hasNotes) {
        alert('No notes to export. Add some notes to your tracks first!');
        return;
      }

      // Show loading state - find button by text content
      const exportButtons = document.querySelectorAll('.export-button');
      let currentButton = null;
      exportButtons.forEach(btn => {
        if (btn.textContent.includes(format.toUpperCase())) {
          currentButton = btn;
          btn.disabled = true;
          const originalText = btn.textContent;
          btn.dataset.originalText = originalText;
          btn.textContent = `Exporting ${format.toUpperCase()}...`;
        }
      });

      // For error handling, we need to intercept the response
      // Axios will throw for non-2xx status, but we want to parse the error message
      let response;
      try {
        response = await api.post(
          `/api/export/${format}/${project._id}`,
          {},
          { 
            responseType: 'blob',
            timeout: 60000, // 60 second timeout for large files
            validateStatus: (status) => {
              // Accept all status codes, we'll handle errors manually
              return true;
            }
          }
        );
      } catch (axiosError) {
        // Re-throw to be handled by outer catch
        throw axiosError;
      }

      // Check if response indicates an error
      if (response.status < 200 || response.status >= 300) {
        // Server returned an error status
        const errorBlob = response.data;
        if (errorBlob instanceof Blob) {
          try {
            const text = await errorBlob.text();
            // Check if it's JSON
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const errorData = JSON.parse(text);
              throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
            } else {
              throw new Error(text || `Server error: ${response.status}`);
            }
          } catch (parseError) {
            throw new Error(`Server returned status ${response.status}`);
          }
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      }
      
      // Check if response is actually an error (JSON error in blob)
      if (response.data && response.data.type && response.data.type.includes('json')) {
        try {
          const text = await response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || 'Export failed');
        } catch (parseError) {
          // Not JSON, continue
        }
      }

      if (!response.data || (response.data.size !== undefined && response.data.size === 0)) {
        throw new Error('Empty response from server');
      }

      const blob = new Blob([response.data], { 
        type: format === 'midi' ? 'audio/midi' : format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(project.name || 'project').replace(/[^a-z0-9]/gi, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      
      let errorMessage = `Failed to export to ${format.toUpperCase()}.`;
      let serverError = null;
      
      if (error.response) {
        // Try to parse error response - it might be a blob with JSON inside
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            // Check if it's JSON
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const errorData = JSON.parse(text);
              serverError = errorData.error || errorData.message || 'Unknown server error';
            } else {
              serverError = text || `Server returned status ${error.response.status}`;
            }
          } catch (parseError) {
            // If parsing fails, check content type
            const contentType = error.response.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              try {
                const text = await error.response.data.text();
                const errorData = JSON.parse(text);
                serverError = errorData.error || errorData.message || 'Unknown server error';
              } catch (e) {
                serverError = `Server returned status ${error.response.status}`;
              }
            } else {
              serverError = `Server returned status ${error.response.status}`;
            }
          }
        } else if (error.response.data) {
          // Direct JSON response
          if (typeof error.response.data === 'object') {
            serverError = error.response.data.error || error.response.data.message || 'Unknown server error';
          } else if (typeof error.response.data === 'string') {
            serverError = error.response.data;
          } else {
            serverError = `Server returned status ${error.response.status}`;
          }
        } else {
          serverError = `Server returned status ${error.response.status}`;
        }
      } else if (error.message) {
        serverError = error.message;
      }

      if (serverError) {
        errorMessage += `\n\n${serverError}`;
      }

      if (format === 'mp3' || format === 'wav') {
        errorMessage += `\n\nNote: ${format.toUpperCase()} export requires FFmpeg and FluidSynth to be installed on the server.`;
        errorMessage += `\nYou can use MIDI export instead, which doesn't require additional tools.`;
      }

      alert(errorMessage);
    } finally {
      // Restore button state
      const exportButtons = document.querySelectorAll('.export-button');
      exportButtons.forEach(btn => {
        if (btn.dataset.originalText) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText;
          delete btn.dataset.originalText;
        }
      });
    }
  };

  return (
    <div className="midi-editor">
      <div className="editor-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h2>{project.name}</h2>
          <span className="collaborators">
            {collaborators} {collaborators === 1 ? 'collaborator' : 'collaborators'}
          </span>
        </div>
        <div className="header-right">
          <button onClick={() => handleExport('midi')} className="export-button">
            Export MIDI
          </button>
          <button onClick={() => handleExport('wav')} className="export-button">
            Export WAV
          </button>
          <button onClick={() => handleExport('mp3')} className="export-button">
            Export MP3
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-main">
          <TrackList
            tracks={tracks}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
            onAddTrack={addTrack}
            onUpdateTrack={updateTrack}
            onDeleteTrack={deleteTrack}
          />
          <PianoRoll
            track={selectedTrack ? tracks.find(t => (t.id === selectedTrack || t._id === selectedTrack)) : null}
            bpm={bpm}
            onAddNote={selectedTrack ? (note) => addNote(selectedTrack, note) : null}
            onUpdateNote={selectedTrack ? (noteId, updates) => updateNote(selectedTrack, noteId, updates) : null}
            onDeleteNote={selectedTrack ? (noteId) => deleteNote(selectedTrack, noteId) : null}
            selectedNotes={selectedNotes}
            onSelectNotes={setSelectedNotes}
          />
        </div>
        <div className="editor-sidebar">
          <AIPanel
            tracks={tracks}
            selectedTrack={selectedTrack ? tracks.find(t => (t.id === selectedTrack || t._id === selectedTrack)) : null}
            onAddNotes={(notes) => {
              if (selectedTrack) {
                notes.forEach(note => addNote(selectedTrack, note));
              }
            }}
          />
        </div>
      </div>

      <PlaybackControls
        isPlaying={isPlaying}
        bpm={bpm}
        onPlay={handlePlay}
        onStop={handleStop}
        onBpmChange={handleBpmChange}
      />
    </div>
  );
}

export default MIDIEditor;

