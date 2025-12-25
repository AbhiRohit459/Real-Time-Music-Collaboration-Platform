# Render Manual Setup Guide (Fix for "Cannot find module" Error)

If you're getting the "Cannot find module 'express'" error, the Blueprint method might not be working correctly. Follow these steps to manually configure your services:

## Step 1: Delete Existing Service (if created via Blueprint)

1. Go to your Render dashboard
2. Find the `spotmies-backend` service
3. Click on it → Settings → Scroll down → Click "Delete Service"
4. Confirm deletion

## Step 2: Create Backend Service Manually

1. **In Render Dashboard:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `AbhiRohit459/Real-Time-Music-Collaboration-Platform`

2. **Configure the Service:**
   - **Name:** `spotmies-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `server` ⚠️ **THIS IS CRITICAL**
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

3. **Add Environment Variables:**
   Click "Add Environment Variable" for each:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your MongoDB connection string>
   CLIENT_URL=<will set after frontend deploys>
   OPENAI_API_KEY=<your OpenAI API key>
   ```
   Optional:
   ```
   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

4. **Click "Create Web Service"**

5. **Wait for Deployment:**
   - Watch the build logs
   - Should see: `npm install` running
   - Should see: Dependencies being installed
   - Should see: `Server running on port 5000`

## Step 3: Verify Build Logs

After clicking "Create Web Service", check the build logs:

**✅ Good Build Log Should Show:**
```
==> Cloning from https://github.com/...
==> Checking out commit abc123...
==> Installing dependencies
> npm install
added 234 packages in 15s
==> Building
==> Starting service
> npm start
Server running on port 5000
```

**❌ Bad Build Log (Current Error):**
```
==> Starting service
> node server/index.js
Error: Cannot find module 'express'
```

## Step 4: If Still Getting Errors

### Option A: Check Root Directory Setting

1. Go to your service → Settings
2. Scroll to "Root Directory"
3. Make sure it says: `server` (not empty, not `/server`, just `server`)
4. Save changes
5. Manual Deploy → "Clear build cache & deploy"

### Option B: Use Alternative Build Command

If Root Directory isn't working:

1. Go to Settings → Build & Deploy
2. Change **Root Directory** to: (leave empty)
3. Change **Build Command** to: `cd server && npm install`
4. Change **Start Command** to: `cd server && npm start`
5. Save and redeploy

### Option C: Verify package.json Exists

1. Check that `server/package.json` exists in your repository
2. Check that `server/package-lock.json` exists (commit it if missing)
3. Verify all dependencies are listed in package.json

## Step 5: Create Frontend Service

1. **In Render Dashboard:**
   - Click "New" → "Static Site"
   - Connect your GitHub repository (same repo)

2. **Configure:**
   - **Name:** `spotmies-frontend`
   - **Branch:** `main`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free

3. **Add Environment Variable:**
   ```
   REACT_APP_SERVER_URL=https://spotmies-backend.onrender.com
   ```
   (Use your actual backend URL)

4. **Click "Create Static Site"**

## Step 6: Update Backend CLIENT_URL

1. Go back to backend service
2. Environment tab
3. Update `CLIENT_URL` to your frontend URL
4. Save (auto-redeploys)

## Troubleshooting Checklist

- [ ] Root Directory is set to `server` (not empty)
- [ ] Build Command is `npm install` (or `cd server && npm install`)
- [ ] Start Command is `npm start` (or `cd server && npm start`)
- [ ] `server/package.json` exists in repository
- [ ] `server/package-lock.json` exists in repository
- [ ] Build logs show dependencies being installed
- [ ] No errors in build logs
- [ ] Environment variables are set correctly

## Still Not Working?

1. **Check Build Logs:**
   - Service → Logs tab
   - Look for npm install output
   - Look for any error messages

2. **Try Clearing Build Cache:**
   - Settings → Build & Deploy
   - Click "Clear build cache & deploy"

3. **Verify Repository:**
   - Make sure latest code is pushed to GitHub
   - Check that `server/` directory exists in repo

4. **Contact Render Support:**
   - Include full build logs
   - Include start logs
   - Mention you're using Root Directory: `server`

