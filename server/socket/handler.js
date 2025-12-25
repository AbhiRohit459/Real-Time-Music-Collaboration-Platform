module.exports = (io) => {
  const activeRooms = new Map(); // roomId -> Set of socketIds

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a project room
    socket.on('join-project', (projectId) => {
      socket.join(projectId);
      if (!activeRooms.has(projectId)) {
        activeRooms.set(projectId, new Set());
      }
      activeRooms.get(projectId).add(socket.id);
      
      // Notify others in the room
      socket.to(projectId).emit('user-joined', {
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      // Send current room count
      io.to(projectId).emit('room-update', {
        userCount: activeRooms.get(projectId).size
      });
      
      console.log(`User ${socket.id} joined project ${projectId}`);
    });

    // Leave a project room
    socket.on('leave-project', (projectId) => {
      socket.leave(projectId);
      if (activeRooms.has(projectId)) {
        activeRooms.get(projectId).delete(socket.id);
        if (activeRooms.get(projectId).size === 0) {
          activeRooms.delete(projectId);
        } else {
          io.to(projectId).emit('room-update', {
            userCount: activeRooms.get(projectId).size
          });
        }
      }
      
      socket.to(projectId).emit('user-left', {
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      console.log(`User ${socket.id} left project ${projectId}`);
    });

    // Broadcast MIDI note addition
    socket.on('note-added', (data) => {
      const { projectId, trackId, note } = data;
      socket.to(projectId).emit('note-added', {
        trackId,
        note,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast MIDI note update
    socket.on('note-updated', (data) => {
      const { projectId, trackId, noteId, note } = data;
      socket.to(projectId).emit('note-updated', {
        trackId,
        noteId,
        note,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast MIDI note deletion
    socket.on('note-deleted', (data) => {
      const { projectId, trackId, noteId } = data;
      socket.to(projectId).emit('note-deleted', {
        trackId,
        noteId,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast track addition
    socket.on('track-added', (data) => {
      const { projectId, track } = data;
      socket.to(projectId).emit('track-added', {
        track,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast track update
    socket.on('track-updated', (data) => {
      const { projectId, trackId, updates } = data;
      socket.to(projectId).emit('track-updated', {
        trackId,
        updates,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast track deletion
    socket.on('track-deleted', (data) => {
      const { projectId, trackId } = data;
      socket.to(projectId).emit('track-deleted', {
        trackId,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast playback state
    socket.on('playback-state', (data) => {
      const { projectId, isPlaying, currentTime } = data;
      socket.to(projectId).emit('playback-state', {
        isPlaying,
        currentTime,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Broadcast project settings change
    socket.on('project-settings-changed', (data) => {
      const { projectId, settings } = data;
      socket.to(projectId).emit('project-settings-changed', {
        settings,
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from all rooms
      activeRooms.forEach((users, projectId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) {
            activeRooms.delete(projectId);
          } else {
            io.to(projectId).emit('room-update', {
              userCount: users.size
            });
          }
          socket.to(projectId).emit('user-left', {
            userId: socket.id,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  });
};

