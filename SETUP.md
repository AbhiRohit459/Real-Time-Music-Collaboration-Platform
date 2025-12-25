# Quick Setup Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB installed (or Docker)
- [ ] FFmpeg installed (for WAV/MP3 export)
- [ ] FluidSynth installed (for MIDI to audio conversion)
- [ ] OpenAI API key OR Anthropic API key

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/AbhiRohit459/Real-Time-Music-Collaboration-Platform.git
cd Real-Time-Music-Collaboration-Platform

# Install all dependencies
npm run install-all
```

### 2. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env and add your API key
# Use either OPENAI_API_KEY or ANTHROPIC_API_KEY (or both)
```

### 3. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**Option B: Local Installation**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service

### 4. Install Audio Tools (for Export)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg fluidsynth fluid-soundfont
```

**macOS:**
```bash
brew install ffmpeg fluidsynth
```

**Windows:**
- Download FFmpeg from https://ffmpeg.org/download.html
- Download FluidSynth from https://www.fluidsynth.org/
- Add both to your PATH

### 5. Start the Application

```bash
# Start both server and client
npm run dev

# Or start separately:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm start
```

### 6. Access the Application

- Open http://localhost:3000 in your browser
- Create your first project and start composing!

## Docker Setup (Alternative)

If you prefer using Docker for everything:

```bash
# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Start all services
docker-compose up

# Access at http://localhost:3000
```

## Troubleshooting

### Port Already in Use
- Change ports in `server/.env` and `client/package.json`
- Or stop the service using the port

### MongoDB Connection Failed
- Verify MongoDB is running: `docker ps` or check MongoDB service
- Check connection string in `server/.env`

### AI Suggestions Not Working
- Verify API key is set correctly
- Check API quota/credits
- Review server logs for errors

### Audio Export Fails
- Verify FFmpeg and FluidSynth are installed
- Check that soundfont is available
- Review server logs for specific errors

## Next Steps

1. Read the [README.md](README.md) for detailed documentation
2. Check [SAMPLE_SESSION.md](SAMPLE_SESSION.md) for usage examples
3. Start creating your first collaborative MIDI project!

