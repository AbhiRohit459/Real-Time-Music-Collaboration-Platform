import React, { useState } from 'react';
import './ProjectList.css';

function ProjectList({ projects, onCreateProject, onSelectProject, onDeleteProject }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreateProject(projectName, projectDescription);
      setProjectName('');
      setProjectDescription('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h1>Spotmies AI</h1>
        <p className="subtitle">Collaborative MIDI Composition Platform</p>
        <button
          className="create-button"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Project
        </button>
      </div>

      <div className="projects-grid">
        {!Array.isArray(projects) || projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => onSelectProject(project)}
            >
              <div className="project-card-header">
                <h3>{project.name}</h3>
                {onDeleteProject && (
                  <button
                    className="delete-project-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project._id);
                    }}
                    title="Delete project"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="project-description">{project.description || 'No description'}</p>
              <div className="project-meta">
                <span>{project.tracks?.length || 0} tracks</span>
                <span>•</span>
                <span>{project.bpm} BPM</span>
              </div>
              <div className="project-date">
                Updated: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Song"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectList;

