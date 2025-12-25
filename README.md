# Spotmies AI - Collaborative MIDI Composition Platform

A real-time collaborative MIDI composition platform with AI-powered harmonization suggestions. Multiple users can compose MIDI sequences together, with AI providing harmony, chord progression, and melody variation suggestions.

## Features

- 🎹 **Multi-track MIDI Editor**: Create and edit multiple MIDI tracks with a visual piano roll interface
- 👥 **Real-time Collaboration**: Multiple users can edit the same project simultaneously using Socket.io
- 🤖 **AI Harmonization**: Get AI-powered suggestions for harmonies, chord progressions, and melody variations
- 🎵 **Audio Playback**: Play your compositions in real-time using Tone.js
- 💾 **Project Management**: Save and version your projects in MongoDB
- 📤 **Audio Export**: Export your compositions to MIDI, WAV, or MP3 formats
- 🐳 **Docker Support**: Easy setup with Docker Compose

## Tech Stack

### Frontend
- React.js
- Tone.js (audio synthesis and playback)
- Socket.io Client (real-time synchronization)
- Axios (HTTP client)

### Backend
- Node.js + Express.js
- Socket.io (WebSocket server)
- MongoDB + Mongoose
- OpenAI API / Anthropic Claude API (AI suggestions)
- FFmpeg & FluidSynth (audio export)

## Prerequisites

- Node.js 18+ and npm
- MongoDB (or use Docker)
- FFmpeg (for WAV/MP3 export)
- FluidSynth (for MIDI to audio conversion)
- OpenAI API key OR Anthropic API key

## Installation

### Option 1: Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/AbhiRohit459/Real-Time-Music-Collaboration-Platform.git
cd spotmies_ai
```

2. Create environment file:
```bash
cp server/.env.example server/.env
```

3. Edit `server/.env` and add your API keys:
```
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Start all services:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Manual Installation

1. Install root dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Set up environment variables:
```bash
cd ../server
cp .env.example .env
# Edit .env and add your API keys
```

5. Start MongoDB (if not using Docker):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or install MongoDB locally
```

6. Start the development servers:
```bash
# From root directory
npm run dev

# Or start separately:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm start
```

## Configuration

### Environment Variables

Create `server/.env` with the following:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spotmies_ai
CLIENT_URL=http://localhost:3000

# AI Service (at least one required)
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Audio Export Setup

For WAV/MP3 export to work, you need:

1. **FFmpeg**: Install from https://ffmpeg.org/
2. **FluidSynth**: Install from https://www.fluidsynth.org/
3. **SoundFont**: Download a soundfont file (e.g., FluidR3_GM.sf2) and configure FluidSynth

On Linux:
```bash
sudo apt-get install ffmpeg fluidsynth fluid-soundfont
```

On macOS:
```bash
brew install ffmpeg fluidsynth
```

On Windows:
Download installers from the respective websites.

## Usage

### Creating a Project

1. Open the application in your browser (http://localhost:3000)
2. Click "Create New Project"
3. Enter a project name and optional description
4. Click "Create"

### Editing MIDI

1. Select a project from the list
2. Click "Add Track" to create a new track
3. Select a track to edit it
4. Click and drag on the piano roll to add notes
5. Right-click notes to delete them
6. Drag notes to move them

### Collaboration

- Multiple users can open the same project simultaneously
- Changes are synchronized in real-time via Socket.io
- See the number of active collaborators in the header

### AI Suggestions

1. Select a track with some notes
2. Open the AI Panel on the right
3. Choose suggestion type (Harmony, Chords, or Melody)
4. Select a style (Pop, Classical, Jazz, Rock, Electronic)
5. Click "Get Suggestions"
6. Review suggestions and click "Apply" to add them to your track

### Playback

1. Click the "Play" button to start playback
2. Adjust BPM using the control in the bottom bar
3. Click "Stop" to stop playback

### Export

1. Click "Export MIDI" to download as MIDI file
2. Click "Export WAV" to download as WAV audio (requires FFmpeg/FluidSynth)
3. Click "Export MP3" to download as MP3 audio (requires FFmpeg/FluidSynth)

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/versions` - Save project version
- `GET /api/projects/:id/versions` - Get project versions

### AI Suggestions
- `POST /api/ai/harmony` - Get harmony suggestions
- `POST /api/ai/chords` - Get chord progression suggestions
- `POST /api/ai/melody` - Get melody variation suggestions

### Export
- `POST /api/export/midi/:projectId` - Export to MIDI
- `POST /api/export/wav/:projectId` - Export to WAV
- `POST /api/export/mp3/:projectId` - Export to MP3

## Socket.io Events

### Client → Server
- `join-project` - Join a project room
- `leave-project` - Leave a project room
- `note-added` - Add a MIDI note
- `note-updated` - Update a MIDI note
- `note-deleted` - Delete a MIDI note
- `track-added` - Add a track
- `track-updated` - Update a track
- `track-deleted` - Delete a track
- `playback-state` - Update playback state
- `project-settings-changed` - Change project settings

### Server → Client
- `user-joined` - User joined the project
- `user-left` - User left the project
- `room-update` - Room user count update
- `note-added` - Note added by another user
- `note-updated` - Note updated by another user
- `note-deleted` - Note deleted by another user
- `track-added` - Track added by another user
- `track-updated` - Track updated by another user
- `track-deleted` - Track deleted by another user
- `playback-state` - Playback state changed by another user
- `project-settings-changed` - Project settings changed by another user

## Project Structure

```
spotmies_ai/
├── server/
│   ├── index.js              # Main server file
│   ├── models/
│   │   └── Project.js        # MongoDB schema
│   ├── routes/
│   │   ├── projects.js       # Project API routes
│   │   ├── ai.js             # AI suggestion routes
│   │   └── export.js        # Export routes
│   ├── services/
│   │   ├── aiService.js      # AI integration service
│   │   └── exportService.js # Audio export service
│   └── socket/
│       └── handler.js       # Socket.io event handlers
├── client/
│   ├── src/
│   │   ├── App.js           # Main app component
│   │   └── components/
│   │       ├── ProjectList.js
│   │       ├── MIDIEditor.js
│   │       ├── TrackList.js
│   │       ├── PianoRoll.js
│   │       ├── PlaybackControls.js
│   │       └── AIPanel.js
│   └── public/
├── docker-compose.yml
└── README.md
```

## Troubleshooting

### Audio Export Not Working
- Ensure FFmpeg and FluidSynth are installed
- Check that the server has write permissions for the exports directory
- Verify soundfont configuration for FluidSynth

### AI Suggestions Not Working
- Verify your API key is set correctly in `.env`
- Check that you have API credits/quota available
- Review server logs for API errors

### Real-time Sync Issues
- Ensure Socket.io connection is established (check browser console)
- Verify server is running and accessible
- Check CORS settings if accessing from different domain

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure MongoDB port (27017) is not blocked

## Development

### Running in Development Mode

```bash
# Install all dependencies
npm run install-all

# Start both server and client
npm run dev

# Or start separately:
cd server && npm run dev
cd client && npm start
```

### Building for Production

```bash
# Build client
cd client
npm run build

# Start production server
cd ../server
npm start
```

## Sample Collaborative Session

1. **User A** creates a project called "Jazz Improv"
2. **User A** adds a track and creates a simple melody (C4, E4, G4)
3. **User B** joins the project and sees User A's melody
4. **User A** requests AI harmony suggestions and applies them
5. **User B** adds a bass line track
6. Both users can see each other's changes in real-time
7. **User A** starts playback, and both users hear it
8. **User B** exports the project as MIDI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

