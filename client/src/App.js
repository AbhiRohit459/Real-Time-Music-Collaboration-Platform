import React, { useState, useEffect } from 'react';
import api from './config/api';
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
      const response = await api.get('/api/projects');
      const data = response.data;
      // Ensure data is an array
      setProjects(Array.isArray(data) ? data : []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};
      
      if (status === 503 && retryCount < MAX_RETRIES) {
        console.warn('Database not connected yet, retrying...', errorData.message || error.message);
        setRetryCount(prev => prev + 1);
        // Retry after a delay if database is not connected
        setTimeout(() => fetchProjects(true), 2000);
        return;
      }
      
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

      const response = await api.post('/api/projects', {
        name: name.trim(),
        description: description ? description.trim() : '',
        owner: 'user-' + Date.now()
      });
      
      const project = response.data;
      if (project && project._id) {
        setProjects(prev => [...(prev || []), project]);
        setCurrentProject(project);
      } else {
        throw new Error('Invalid project data received');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert('Failed to create project: ' + errorMessage);
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
      await api.delete(`/api/projects/${projectId}`);
      
      // Remove project from list
      setProjects(projects.filter(p => p._id !== projectId));
      
      // If the deleted project was currently open, go back to list
      if (currentProject && currentProject._id === projectId) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert('Failed to delete project: ' + errorMessage);
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

