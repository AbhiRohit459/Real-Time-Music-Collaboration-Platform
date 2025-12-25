import React, { useState } from 'react';
import axios from 'axios';
import './AIPanel.css';

function AIPanel({ tracks, selectedTrack, onAddNotes }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestionType, setSuggestionType] = useState('harmony');
  const [style, setStyle] = useState('pop');

  const getSelectedTrackNotes = () => {
    if (!selectedTrack) return [];
    return selectedTrack.notes || [];
  };

  const handleGetHarmony = async () => {
    if (!selectedTrack || selectedTrack.notes.length === 0) {
      alert('Please add some notes to the selected track first');
      return;
    }

    setLoading(true);
    try {
      const notes = getSelectedTrackNotes();
      const response = await axios.post('/api/ai/harmony', {
        notes: notes.map(n => ({ note: n.note })),
        context: {
          track: selectedTrack.name,
          bpm: 120
        },
        style
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error getting harmony suggestions:', error);
      alert('Failed to get AI suggestions. Make sure the AI service is configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetChords = async () => {
    setLoading(true);
    try {
      const notes = getSelectedTrackNotes();
      const currentChords = notes.length > 0 
        ? [notes[0].note] 
        : ['C'];
      
      const response = await axios.post('/api/ai/chords', {
        currentChords,
        key: 'C',
        style
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error getting chord suggestions:', error);
      alert('Failed to get AI suggestions. Make sure the AI service is configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetMelody = async () => {
    if (!selectedTrack || selectedTrack.notes.length === 0) {
      alert('Please add some notes to the selected track first');
      return;
    }

    setLoading(true);
    try {
      const notes = getSelectedTrackNotes();
      const response = await axios.post('/api/ai/melody', {
        melody: notes.map(n => ({ note: n.note })),
        context: {
          track: selectedTrack.name
        },
        variations: 3
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error getting melody suggestions:', error);
      alert('Failed to get AI suggestions. Make sure the AI service is configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (!selectedTrack || !onAddNotes) {
      alert('Please select a track first');
      return;
    }

    const notes = Array.isArray(suggestion) 
      ? suggestion 
      : (suggestions.suggestions || suggestions.progressions?.[0] || suggestions.variations?.[0] || []);

    if (Array.isArray(notes[0])) {
      // It's a chord progression
      notes.forEach((chord, index) => {
        chord.forEach((noteItem, noteIndex) => {
          // Handle both object and string formats
          const noteName = typeof noteItem === 'object' && noteItem !== null ? noteItem.note : noteItem;
          const noteString = String(noteName || '');
          onAddNotes([{
            note: noteString.includes('4') ? noteString : `${noteString}4`,
            startTime: index * 2,
            duration: 2,
            velocity: 100
          }]);
        });
      });
    } else {
      // It's a single set of notes
      const lastNote = selectedTrack.notes[selectedTrack.notes.length - 1];
      const startTime = lastNote ? lastNote.startTime + lastNote.duration : 0;
      
      notes.forEach((noteItem, index) => {
        // Handle both object and string formats
        const noteName = typeof noteItem === 'object' && noteItem !== null ? noteItem.note : noteItem;
        const noteString = String(noteName || '');
        onAddNotes([{
          note: noteString.includes('4') ? noteString : `${noteString}4`,
          startTime: startTime + index * 0.5,
          duration: 0.5,
          velocity: 100
        }]);
      });
    }
  };

  const handleSuggestionTypeChange = (type) => {
    setSuggestionType(type);
    setSuggestions(null);
  };

  return (
    <div className="ai-panel">
      <h3>AI Suggestions</h3>
      
      {!selectedTrack && (
        <div className="ai-panel-message">
          Select a track to get AI suggestions
        </div>
      )}

      {selectedTrack && (
        <>
          <div className="ai-controls">
            <div className="suggestion-type-selector">
              <button
                className={suggestionType === 'harmony' ? 'active' : ''}
                onClick={() => handleSuggestionTypeChange('harmony')}
              >
                Harmony
              </button>
              <button
                className={suggestionType === 'chords' ? 'active' : ''}
                onClick={() => handleSuggestionTypeChange('chords')}
              >
                Chords
              </button>
              <button
                className={suggestionType === 'melody' ? 'active' : ''}
                onClick={() => handleSuggestionTypeChange('melody')}
              >
                Melody
              </button>
            </div>

            <div className="style-selector">
              <label>Style:</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="pop">Pop</option>
                <option value="classical">Classical</option>
                <option value="jazz">Jazz</option>
                <option value="rock">Rock</option>
                <option value="electronic">Electronic</option>
              </select>
            </div>

            <button
              className="get-suggestions-button"
              onClick={() => {
                if (suggestionType === 'harmony') handleGetHarmony();
                else if (suggestionType === 'chords') handleGetChords();
                else if (suggestionType === 'melody') handleGetMelody();
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Get Suggestions'}
            </button>
          </div>

          {suggestions && (
            <div className="suggestions">
              <div className="suggestion-reason">
                {suggestions.reason || 'AI-generated suggestion'}
              </div>

              {suggestions.suggestions && (
                <div className="suggestion-item">
                  <h4>Harmony Notes:</h4>
                  <div className="suggestion-notes">
                    {suggestions.suggestions.map((note, i) => {
                      const noteValue = typeof note === 'object' && note !== null ? note.note : note;
                      return (
                        <span key={i} className="note-badge">{noteValue || String(note)}</span>
                      );
                    })}
                  </div>
                  <button
                    className="apply-button"
                    onClick={() => handleApplySuggestion(suggestions.suggestions)}
                  >
                    Apply
                  </button>
                </div>
              )}

              {suggestions.progressions && (
                <div className="suggestion-item">
                  <h4>Chord Progressions:</h4>
                  {suggestions.progressions.map((progression, i) => (
                    <div key={i} className="progression">
                      <div className="suggestion-notes">
                        {progression.map((chord, j) => {
                          const chordValue = typeof chord === 'object' && chord !== null ? chord.note : chord;
                          return (
                            <span key={j} className="note-badge">{chordValue || String(chord)}</span>
                          );
                        })}
                      </div>
                      <button
                        className="apply-button"
                        onClick={() => handleApplySuggestion(progression)}
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.variations && (
                <div className="suggestion-item">
                  <h4>Melody Variations:</h4>
                  {suggestions.variations.map((variation, i) => (
                    <div key={i} className="variation">
                      <div className="suggestion-notes">
                        {variation.map((note, j) => {
                          const noteValue = typeof note === 'object' && note !== null ? note.note : note;
                          return (
                            <span key={j} className="note-badge">{noteValue || String(note)}</span>
                          );
                        })}
                      </div>
                      <button
                        className="apply-button"
                        onClick={() => handleApplySuggestion(variation)}
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AIPanel;

