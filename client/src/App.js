import React, { useState, useEffect } from 'react';
import ProjectList from './components/ProjectList';
import MIDIEditor from './components/MIDIEditor';
import './App.css';

function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (isRetry = false) => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 && retryCount < MAX_RETRIES) {
          console.warn('Database not connected yet, retrying...', errorData.message);
          setRetryCount(prev => prev + 1);
          // Retry after a delay if database is not connected
          setTimeout(() => fetchProjects(true), 2000);
          return;
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      setProjects(Array.isArray(data) ? data : []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  const handleCreateProject = async (name, description) => {
    try {
      if (!name || !name.trim()) {
        alert('Please enter a project name');
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description ? description.trim() : '',
          owner: 'user-' + Date.now()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const project = await response.json();
      if (project && project._id) {
        setProjects(prev => [...(prev || []), project]);
        setCurrentProject(project);
      } else {
        throw new Error('Invalid project data received');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSelectProject = (project) => {
    setCurrentProject(project);
  };

  const handleBackToList = () => {
    setCurrentProject(null);
    fetchProjects();
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Remove project from list
      setProjects(projects.filter(p => p._id !== projectId));
      
      // If the deleted project was currently open, go back to list
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      {!currentProject ? (
        <ProjectList
          projects={projects}
          onCreateProject={handleCreateProject}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <MIDIEditor
          project={currentProject}
          onBack={handleBackToList}
          onProjectUpdate={fetchProjects}
        />
      )}
    </div>
  );
}

export default App;

