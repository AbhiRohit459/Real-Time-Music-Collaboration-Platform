const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

// Helper to convert note names to MIDI numbers
function noteToMidi(note) {
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const match = note.match(/([A-G][#b]?)(\d+)/);
  if (!match) return null;
  
  const [, noteName, octave] = match;
  return noteMap[noteName] + (parseInt(octave) + 1) * 12;
}

// Helper to convert MIDI numbers to note names
function midiToNote(midi) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

// Analyze notes to extract chords and key
function analyzeNotes(notes) {
  const midiNotes = notes.map(n => noteToMidi(n.note)).filter(n => n !== null);
  if (midiNotes.length === 0) return { chords: [], key: 'C' };
  
  // Simple chord detection (simplified)
  const uniqueNotes = [...new Set(midiNotes.map(n => n % 12))];
  const chords = [];
  
  // Detect common triads
  for (let root = 0; root < 12; root++) {
    const third = (root + 4) % 12;
    const fifth = (root + 7) % 12;
    if (uniqueNotes.includes(root) && uniqueNotes.includes(third) && uniqueNotes.includes(fifth)) {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      chords.push(noteNames[root]);
    }
  }
  
  return { chords: chords.length > 0 ? chords : ['C'], key: 'C' };
}

async function callAI(prompt, systemPrompt) {
  // Try OpenAI first, then Claude
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }
  
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      console.error('Claude error:', error);
    }
  }
  
  // Fallback: return basic suggestions
  return JSON.stringify({ suggestions: ['C', 'E', 'G'], reason: 'AI service not configured' });
}

async function suggestHarmony(notes, context = {}, style = 'classical') {
  const analysis = analyzeNotes(notes);
  const noteNames = notes.map(n => n.note).join(', ');
  
  const systemPrompt = `You are a music theory expert. Provide harmony suggestions in JSON format with a "suggestions" array of note names (e.g., ["C4", "E4", "G4"]) and a "reason" explanation.`;
  
  const prompt = `Given these notes: ${noteNames}
Current context: ${JSON.stringify(context)}
Style: ${style}
Key: ${analysis.key}
Current chords: ${analysis.chords.join(', ')}

Suggest 3-5 harmony notes that would complement these notes. Return only valid JSON with "suggestions" array and "reason" string.`;

  const response = await callAI(prompt, systemPrompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      suggestions: parsed.suggestions || ['C4', 'E4', 'G4'],
      reason: parsed.reason || 'Harmony suggestion',
      analysis
    };
  } catch (error) {
    // Fallback suggestions
    return {
      suggestions: ['C4', 'E4', 'G4', 'A4'],
      reason: 'Basic triad harmony',
      analysis
    };
  }
}

async function suggestChordProgression(currentChords, key = 'C', style = 'pop') {
  const systemPrompt = `You are a music theory expert. Provide chord progression suggestions in JSON format with a "progressions" array of chord arrays (e.g., [["C", "E", "G"], ["D", "F", "A"]]) and a "reason" explanation.`;
  
  const prompt = `Current chords: ${currentChords.join(', ')}
Key: ${key}
Style: ${style}

Suggest 2-3 chord progressions (each as an array of note names) that would work well. Return only valid JSON with "progressions" array and "reason" string.`;

  const response = await callAI(prompt, systemPrompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      progressions: parsed.progressions || [['C', 'E', 'G'], ['F', 'A', 'C']],
      reason: parsed.reason || 'Chord progression suggestion',
      key
    };
  } catch (error) {
    // Common progressions as fallback
    const fallbacks = {
      'C': [['C', 'E', 'G'], ['F', 'A', 'C'], ['G', 'B', 'D']],
      'G': [['G', 'B', 'D'], ['C', 'E', 'G'], ['D', 'F#', 'A']]
    };
    return {
      progressions: fallbacks[key] || fallbacks['C'],
      reason: 'Common chord progression',
      key
    };
  }
}

async function suggestMelodyVariations(melody, context = {}, variations = 3) {
  const noteNames = melody.map(n => n.note || n).join(', ');
  
  const systemPrompt = `You are a music theory expert. Provide melody variations in JSON format with a "variations" array where each variation is an array of note names, and a "reason" explanation.`;
  
  const prompt = `Original melody: ${noteNames}
Context: ${JSON.stringify(context)}
Number of variations: ${variations}

Suggest ${variations} melodic variations that maintain the same rhythm and feel. Return only valid JSON with "variations" array and "reason" string.`;

  const response = await callAI(prompt, systemPrompt);
  
  try {
    const parsed = JSON.parse(response);
    return {
      variations: parsed.variations || [melody],
      reason: parsed.reason || 'Melody variation',
      original: melody
    };
  } catch (error) {
    // Return original as variation
    return {
      variations: [melody],
      reason: 'Original melody',
      original: melody
    };
  }
}

module.exports = {
  suggestHarmony,
  suggestChordProgression,
  suggestMelodyVariations,
  noteToMidi,
  midiToNote
};

