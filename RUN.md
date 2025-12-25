# Quick Run Commands

## Option 1: Manual Setup (Recommended for Development)

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Set Up Environment Variables
```bash
# Windows (PowerShell)
Copy-Item server\.env.example server\.env

# Linux/Mac
cp server/.env.example server/.env
```

### Step 3: Edit Environment File
Open `server/.env` and add your API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 4: Start MongoDB
```bash
# Using Docker (easiest)
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or use your local MongoDB installation
```

### Step 5: Run the Application
```bash
npm run dev
```

This will start both server (port 5000) and client (port 3000).

**Access the app at: http://localhost:3000**

---

## Option 2: Docker Compose (Easiest)

### Step 1: Set Up Environment
```bash
# Windows (PowerShell)
Copy-Item server\.env.example server\.env

# Linux/Mac
cp server/.env.example server/.env
```

### Step 2: Edit Environment File
Open `server/.env` and add your API key.

### Step 3: Start Everything
```bash
docker-compose up
```

**Access the app at: http://localhost:3000**

To stop:
```bash
docker-compose down
```

---

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is in use:
- Change `PORT` in `server/.env`
- Change port in `client/package.json` (add `PORT=3001` to start script)

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker ps

# If not, start it
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Dependencies Not Installed
```bash
# Install all dependencies again
npm run install-all
```

### API Key Not Working
- Make sure you have credits/quota in your OpenAI or Anthropic account
- Verify the key is correct in `server/.env`
- Check server logs for API errors

