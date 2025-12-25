# Render Deployment Guide for Spotmies AI

This guide will walk you through deploying your Spotmies AI project on Render.

## Prerequisites

Before you begin, make sure you have:
- ✅ A GitHub account with your repository pushed
- ✅ A Render account (sign up at https://render.com - free tier available)
- ✅ MongoDB Atlas account (free tier) OR use Render's MongoDB service
- ✅ OpenAI API key OR Anthropic API key (for AI features)

---

## Step 1: Set Up MongoDB

You have two options for MongoDB:

### Option A: MongoDB Atlas (Recommended - Free Forever)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster:
   - Choose **Free M0** tier
   - Select a cloud provider and region (choose one close to your Render region)
   - Click "Create Cluster"
4. Configure database access:
   - Go to "Database Access" → "Add New Database User"
   - Create a username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
5. Configure network access:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Render's IP ranges (not necessary if allowing all)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/spotmies_ai?retryWrites=true&w=majority`

### Option B: Render MongoDB (Free Tier Available)

1. In Render dashboard, click "New" → "MongoDB"
2. Choose free tier (512MB)
3. Copy the connection string from the MongoDB service dashboard

---

## Step 2: Deploy Backend Service

1. **Sign up/Login to Render**
   - Go to https://render.com
   - Sign up with GitHub (recommended)

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select your repository: `AbhiRohit459/Real-Time-Music-Collaboration-Platform` (or your repo)

3. **Configure Backend Service**
   - **Name:** `spotmies-backend` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

4. **Add Environment Variables**
   Click "Add Environment Variable" and add:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your MongoDB connection string from Step 1>
   CLIENT_URL=<we'll set this after frontend deploys>
   OPENAI_API_KEY=<your OpenAI API key>
   ```
   Optional:
   ```
   ANTHROPIC_API_KEY=<your Anthropic API key if using Claude>
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying
   - Wait for deployment to complete (usually 2-5 minutes)
   - Copy the service URL (e.g., `https://spotmies-backend.onrender.com`)

---

## Step 3: Deploy Frontend Service

1. **Create New Static Site**
   - In Render dashboard, click "New" → "Static Site"
   - Connect your GitHub repository (same repo)

2. **Configure Frontend Service**
   - **Name:** `spotmies-frontend` (or your preferred name)
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free

3. **Add Environment Variable**
   ```
   REACT_APP_SERVER_URL=<your backend URL from Step 2>
   ```
   Example: `https://spotmies-backend.onrender.com`

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build and deployment to complete
   - Copy the frontend URL (e.g., `https://spotmies-frontend.onrender.com`)

---

## Step 4: Update Backend CLIENT_URL

1. Go back to your backend service in Render dashboard
2. Go to "Environment" tab
3. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://spotmies-frontend.onrender.com
   ```
4. Render will automatically redeploy with the new environment variable

---

## Step 5: Using render.yaml (Alternative Method)

If you prefer to use the `render.yaml` file for infrastructure as code:

1. **Push render.yaml to your repository** (already done)

2. **In Render Dashboard:**
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and create services automatically

3. **Set Environment Variables:**
   - Go to each service and add the required environment variables:
     - Backend: `MONGODB_URI`, `OPENAI_API_KEY`, `CLIENT_URL`
     - Frontend: `REACT_APP_SERVER_URL`

4. **Update CLIENT_URL** after frontend deploys (same as Step 4)

---

## Environment Variables Summary

### Backend Service:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spotmies_ai
CLIENT_URL=https://your-frontend-url.onrender.com
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... (optional)
```

### Frontend Service:
```env
REACT_APP_SERVER_URL=https://your-backend-url.onrender.com
```

---

## Post-Deployment Checklist

- [ ] Backend service is running (check logs)
- [ ] Frontend is accessible
- [ ] MongoDB connection is working (check backend logs)
- [ ] Environment variables are set correctly
- [ ] Frontend can connect to backend (test API calls)
- [ ] Socket.io connections work (test real-time features)
- [ ] AI suggestions work (test with API keys)
- [ ] CORS is configured correctly

---

## Testing Your Deployment

1. **Visit your frontend URL**
   - Should load without errors
   - Check browser console for any connection issues

2. **Test Basic Features:**
   - Create a new project
   - Add tracks and notes
   - Test real-time collaboration (open in two browsers)

3. **Test AI Features:**
   - Select a track with notes
   - Try "Get Suggestions" in AI Panel
   - Should connect to OpenAI/Anthropic API

4. **Test Export:**
   - Export project as MIDI
   - Note: Audio export (MP3/WAV) may require additional server setup

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
- Go to backend service → "Logs" tab
- Look for error messages

**Common issues:**
- ❌ MongoDB connection failed
  - Verify `MONGODB_URI` is correct
  - Check MongoDB Atlas IP whitelist
  - Ensure password is URL-encoded if it contains special characters

- ❌ Port already in use
  - Render sets PORT automatically, but verify it's set to 5000

- ❌ Missing dependencies
  - Check `server/package.json` has all dependencies
  - Verify build completed successfully

### Frontend Can't Connect to Backend

**Symptoms:**
- API calls fail
- CORS errors in browser console
- Socket.io connection fails

**Solutions:**
- ✅ Verify `REACT_APP_SERVER_URL` is set correctly (no trailing slash)
- ✅ Verify `CLIENT_URL` in backend matches frontend URL exactly
- ✅ Check backend CORS configuration allows your frontend URL
- ✅ Ensure backend is running (check status in dashboard)

### Socket.io Not Working

**Check:**
- ✅ `CLIENT_URL` in backend matches frontend URL
- ✅ WebSocket support is enabled (Render supports this by default)
- ✅ Check browser console for connection errors
- ✅ Verify socket.io server is running (check backend logs)

### Build Failures

**Common causes:**
- ❌ Node.js version mismatch
  - Render uses Node 18+ by default
  - Add `.nvmrc` file if you need specific version

- ❌ Missing dependencies
  - Check `package.json` files
  - Verify all dependencies are listed

- ❌ Build command errors
  - Check build logs for specific errors
  - Verify `npm install` completes successfully

### Free Tier Limitations

**Render Free Tier:**
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down may take 30-60 seconds
- ⚠️ Limited to 750 hours/month total
- ⚠️ 512MB RAM limit

**Solutions:**
- Upgrade to paid plan ($7/month) for always-on service
- Use MongoDB Atlas (free forever) instead of Render MongoDB
- Consider using Railway or other platforms for better free tier

---

## Custom Domains

To add a custom domain:

1. **In Render Dashboard:**
   - Go to your service → "Settings" → "Custom Domains"
   - Click "Add Custom Domain"
   - Enter your domain

2. **Configure DNS:**
   - Add CNAME record pointing to Render's provided hostname
   - Wait for DNS propagation (can take up to 48 hours)

3. **SSL Certificate:**
   - Render automatically provisions SSL certificates
   - Wait for certificate to be issued (usually a few minutes)

---

## Monitoring and Logs

**View Logs:**
- Go to service → "Logs" tab
- Real-time logs are available
- Logs are retained for a limited time on free tier

**Health Checks:**
- Backend has `/api/health` endpoint
- Render automatically monitors service health
- Failed health checks trigger alerts (on paid plans)

---

## Cost Estimate

**Free Tier:**
- Backend: Free (with limitations)
- Frontend: Free
- MongoDB: Free (if using Atlas)
- **Total: $0/month**

**Paid Tier (Recommended for Production):**
- Backend: $7/month (Starter plan)
- Frontend: Free (static sites are free)
- MongoDB: Free (Atlas) or $15/month (Render MongoDB)
- **Total: $7-22/month**

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring (if using paid plan)
3. ✅ Configure custom domain (optional)
4. ✅ Set up backups for MongoDB
5. ✅ Document your deployment process
6. ✅ Share your deployed app! 🎉

---

## Support

If you encounter issues:

1. Check Render documentation: https://render.com/docs
2. Check service logs in Render dashboard
3. Verify all environment variables are set
4. Test locally first to isolate issues
5. Check GitHub issues or create a new one

---

## Quick Reference

**Backend URL:** `https://spotmies-backend.onrender.com`  
**Frontend URL:** `https://spotmies-frontend.onrender.com`  
**Health Check:** `https://spotmies-backend.onrender.com/api/health`

**Render Dashboard:** https://dashboard.render.com

---

Good luck with your deployment! 🚀

