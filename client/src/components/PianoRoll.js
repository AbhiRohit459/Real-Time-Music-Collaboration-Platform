import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import './PianoRoll.css';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [8, 7, 6, 5, 4, 3, 2, 1];
const BEATS_PER_MEASURE = 16;
const PIXELS_PER_BEAT = 40;

function PianoRoll({ track, bpm, onAddNote, onUpdateNote, onDeleteNote, selectedNotes = [], onSelectNotes }) {
  const [notes, setNotes] = useState(track?.notes || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragNote, setDragNote] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    setNotes(track?.notes || []);
  }, [track]);

  // Cleanup synth on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
        synthRef.current = null;
      }
    };
  }, []);

  const noteToY = (noteName) => {
    if (!noteName) return 0;
    const match = noteName.match(/([A-G][#b]?)(\d+)/);
    if (!match) return 0;
    const [, note, octave] = match;
    const noteIndex = NOTES.indexOf(note);
    const octaveIndex = OCTAVES.indexOf(parseInt(octave));
    if (octaveIndex === -1 || noteIndex === -1) return 0;
    return (octaveIndex * 12 + (12 - noteIndex - 1)) * 20;
  };

  const yToNote = (y) => {
    const row = Math.floor(y / 20);
    const octaveIndex = Math.floor(row / 12);
    const noteIndex = 11 - (row % 12);
    if (octaveIndex >= OCTAVES.length || noteIndex < 0 || noteIndex >= NOTES.length) return null;
    return `${NOTES[noteIndex]}${OCTAVES[octaveIndex]}`;
  };

  const beatToX = (beat) => {
    return beat * PIXELS_PER_BEAT;
  };

  const xToBeat = (x) => {
    return Math.max(0, Math.floor(x / PIXELS_PER_BEAT));
  };

  const playNote = async (noteName) => {
    try {
      // Start AudioContext on first user interaction (required by browser policy)
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Wait a tiny bit to ensure context is fully ready
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Create synth lazily on first use (after AudioContext is started)
      if (!synthRef.current) {
        const synth = new Tone.Synth();
        // Try different methods to connect to destination
        try {
          if (synth.toDestination && typeof synth.toDestination === 'function') {
            synth.toDestination();
          } else if (Tone.Destination) {
            synth.connect(Tone.Destination);
          } else if (Tone.getDestination && typeof Tone.getDestination === 'function') {
            synth.connect(Tone.getDestination());
          } else {
            // Fallback: try to access destination through context
            const destination = Tone.context.destination;
            if (destination) {
              synth.connect(destination);
            }
          }
        } catch (connectError) {
          console.warn('Could not connect synth to destination:', connectError);
        }
        synthRef.current = synth;
      }
      
      if (synthRef.current) {
        synthRef.current.triggerAttackRelease(noteName, '8n');
      }
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  const handleMouseDown = (e) => {
    if (!track || !onAddNote) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - 60; // Account for piano keys width
    const y = e.clientY - rect.top;
    
    if (x < 0) {
      // Clicked on piano keys
      const note = yToNote(y);
      if (note) playNote(note);
      return;
    }

    const beat = xToBeat(x);
    const note = yToNote(y);
    
    if (!note) return;

    // Check if clicking on existing note
    const clickedNote = notes.find(n => {
      if (!n.note || n.startTime === undefined || n.duration === undefined) return false;
      const noteY = noteToY(n.note);
      const noteX = beatToX(n.startTime);
      const noteWidth = beatToX(n.duration);
      return Math.abs(noteY - y) < 10 && 
             x >= noteX && 
             x <= noteX + noteWidth;
    });

    if (clickedNote && e.button === 0) {
      // Start dragging or select note
      if (onSelectNotes && typeof onSelectNotes === 'function') {
        const noteId = clickedNote.id || clickedNote._id;
        if (noteId) {
          onSelectNotes([noteId]);
        }
      }
      setDragNote(clickedNote);
      setDragStart({ x: e.clientX - rect.left - 60, y: e.clientY - rect.top, beat: clickedNote.startTime });
      setIsDrawing(false);
    } else if (e.button === 0) {
      // Start drawing new note
      setIsDrawing(true);
      setDragStart({ x, y, beat, note });
    } else if (e.button === 2 && clickedNote) {
      // Right click to delete
      e.preventDefault();
      const noteId = clickedNote.id || clickedNote._id;
      if (noteId && onDeleteNote) {
        onDeleteNote(noteId);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!track || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 70;
    const y = e.clientY - rect.top;

    if (dragNote && dragStart && typeof dragStart.beat === 'number') {
      // Update dragged note
      const currentBeat = xToBeat(x);
      const deltaBeat = currentBeat - dragStart.beat;
      const newNote = yToNote(y);
      
      if (newNote && onUpdateNote && dragNote.startTime !== undefined) {
        const noteId = dragNote.id || dragNote._id;
        if (noteId) {
          onUpdateNote(noteId, {
            startTime: Math.max(0, (dragNote.startTime || 0) + deltaBeat),
            note: newNote
          });
        }
      }
    } else if (isDrawing && dragStart && typeof dragStart.beat === 'number') {
      // Drawing new note - visual feedback could be added here
      const currentBeat = xToBeat(x);
      const startBeat = dragStart.beat;
      const duration = Math.max(0.25, currentBeat - startBeat);
      
      // Note is being drawn, will be added on mouse up
      if (duration <= 0) {
        setIsDrawing(false);
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!track || !onAddNote) return;

    if (isDrawing && dragStart && typeof dragStart.beat === 'number' && dragStart.note) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - 70;
        const currentBeat = xToBeat(x);
        const startBeat = dragStart.beat;
        const duration = Math.max(0.25, currentBeat - startBeat);
        
        if (duration > 0 && dragStart.note) {
          onAddNote({
            note: dragStart.note,
            startTime: Math.max(0, startBeat),
            duration: duration,
            velocity: 100
          });
        }
      }
    }

    setIsDrawing(false);
    setDragNote(null);
    setDragStart(null);
  };

  const renderPianoKeys = () => {
    return OCTAVES.map(octave =>
      NOTES.map(note => {
        const noteName = `${note}${octave}`;
        const isBlack = note.includes('#');
        return (
          <div
            key={noteName}
            className={`piano-key ${isBlack ? 'black' : 'white'}`}
            style={{ height: '20px' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              playNote(noteName);
            }}
          >
            {!isBlack && (
              <span className="piano-key-label">
                {note === 'C' && `${note}${octave}`}
              </span>
            )}
          </div>
        );
      })
    ).flat();
  };

  const renderNotes = () => {
    if (!Array.isArray(notes)) return null;
    
    return notes.map(note => {
      if (!note || !note.note) return null;
      
      const noteId = note.id || note._id;
      if (!noteId) return null;
      
      const y = noteToY(note.note);
      const x = beatToX(note.startTime || 0);
      const width = beatToX(note.duration || 0.25);
      const isSelected = selectedNotes.includes(noteId);

      return (
        <div
          key={noteId}
          className={`midi-note ${isSelected ? 'selected' : ''}`}
          style={{
            top: `${y}px`,
            left: `${x + 70}px`,
            width: `${Math.max(5, width)}px`,
            height: '18px',
            backgroundColor: track?.color || '#4CAF50',
            position: 'absolute',
            border: isSelected ? '2px solid #FFD700' : '1px solid rgba(0,0,0,0.2)',
            borderRadius: '2px',
            cursor: 'move'
          }}
        />
      );
    }).filter(Boolean);
  };

  if (!track) {
    return (
      <div className="piano-roll empty">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎹</div>
          <p style={{ fontSize: '18px', color: '#888', marginBottom: '10px' }}>Select a track to start editing</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Choose a track from the left panel to begin composing</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="piano-roll"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="piano-keys">
        {renderPianoKeys()}
      </div>
      <div className="piano-roll-content">
        <div className="piano-roll-grid" style={{ width: `${BEATS_PER_MEASURE * PIXELS_PER_BEAT}px`, position: 'relative' }}>
          {Array.from({ length: BEATS_PER_MEASURE }).map((_, i) => (
            <div
              key={i}
              className="grid-line"
              style={{ left: `${i * PIXELS_PER_BEAT + 70}px` }}
            />
          ))}
          {renderNotes()}
        </div>
      </div>
    </div>
  );
}

export default PianoRoll;
