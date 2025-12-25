import React, { useState } from 'react';
import './TrackList.css';

function TrackList({ tracks, selectedTrack, onSelectTrack, onAddTrack, onUpdateTrack, onDeleteTrack }) {
  const [editingTrack, setEditingTrack] = useState(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (track) => {
    setEditingTrack(track.id || track._id);
    setEditName(track.name);
  };

  const handleSaveEdit = (trackId) => {
    onUpdateTrack(trackId, { name: editName });
    setEditingTrack(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingTrack(null);
    setEditName('');
  };

  return (
    <div className="track-list">
      <div className="track-list-header">
        <h3>Tracks</h3>
        <button className="add-track-button" onClick={onAddTrack}>
          + Add Track
        </button>
      </div>
      <div className="tracks">
        {tracks.map((track) => {
          const trackId = track.id || track._id;
          const isSelected = selectedTrack === trackId;
          const isEditing = editingTrack === trackId;

          return (
            <div
              key={trackId}
              className={`track-item ${isSelected ? 'selected' : ''}`}
              style={{ borderLeftColor: track.color || '#4CAF50' }}
            >
              <div
                className="track-content"
                onClick={() => !isEditing && onSelectTrack(trackId)}
              >
                {isEditing ? (
                  <div className="track-edit">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(trackId);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onBlur={() => handleSaveEdit(trackId)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <>
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-meta">
                        {track.notes?.length || 0} notes • {track.instrument}
                      </div>
                    </div>
                    <div className="track-actions">
                      <button
                        className="track-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(track);
                        }}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        className="track-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this track?')) {
                            onDeleteTrack(trackId);
                          }
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {tracks.length === 0 && (
          <div className="empty-tracks">
            <p>No tracks yet. Click "Add Track" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackList;

