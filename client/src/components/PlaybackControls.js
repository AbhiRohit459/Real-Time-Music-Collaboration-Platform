import React from 'react';
import './PlaybackControls.css';

function PlaybackControls({ isPlaying, bpm, onPlay, onStop, onBpmChange }) {
  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    if (newBpm > 0 && newBpm <= 300) {
      onBpmChange(newBpm);
    }
  };

  return (
    <div className="playback-controls">
      <div className="playback-buttons">
        <button
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={isPlaying ? onStop : onPlay}
        >
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
      </div>
      <div className="bpm-control">
        <label>BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={handleBpmChange}
          min="1"
          max="300"
          className="bpm-input"
        />
      </div>
    </div>
  );
}

export default PlaybackControls;

