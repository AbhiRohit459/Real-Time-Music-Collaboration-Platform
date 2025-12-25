# Render Deployment Troubleshooting

## Issue: "Cannot find module 'express'" Error

If you're getting this error during deployment, it means dependencies aren't being installed correctly.

### Solution 1: Use rootDir in render.yaml (Recommended)

The `render.yaml` file has been updated to use `rootDir` which tells Render where your service code is located. This ensures build and start commands run from the correct directory.

**Current configuration:**
```yaml
services:
  - type: web
    name: spotmies-backend
    env: node
    rootDir: server
    buildCommand: npm install --production=false
    startCommand: npm start
```

### Solution 2: Manual Service Configuration

If using Blueprint doesn't work, configure services manually:

1. **Backend Service Settings:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

2. **Frontend Service Settings:**
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

### Solution 3: Alternative Build Command

If `npm ci` fails, use `npm install`:

```yaml
buildCommand: npm install
```

### Solution 4: Check package-lock.json

Ensure `server/package-lock.json` is committed to your repository:
```bash
git add server/package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Solution 5: Verify Dependencies

Check that `server/package.json` includes all required dependencies:
- express
- mongoose
- socket.io
- cors
- dotenv
- etc.

### Solution 6: Manual Deployment Steps

If Blueprint continues to fail:

1. **Delete the existing service** in Render dashboard
2. **Create new Web Service** manually
3. **Set Root Directory** to `server`
4. **Set Build Command** to `npm install`
5. **Set Start Command** to `npm start`
6. **Add environment variables** manually
7. **Deploy**

### Common Issues

**Issue:** Build succeeds but start fails
- **Fix:** Ensure `rootDir` is set correctly
- **Fix:** Verify start command is `npm start` (not `node server/index.js`)

**Issue:** Dependencies not found even after build
- **Fix:** Check that `node_modules` is in `.gitignore` (it should be)
- **Fix:** Ensure build command completes successfully
- **Fix:** Check build logs for npm errors

**Issue:** Wrong directory in error messages
- **Fix:** The error shows `/opt/render/project/src/server/index.js` - this is correct
- **Fix:** Ensure `rootDir: server` is set in render.yaml

### Verification Steps

After fixing the configuration:

1. **Check Build Logs:**
   - Should show: `npm install` running
   - Should show: Dependencies being installed
   - Should NOT show: "Cannot find module" errors

2. **Check Start Logs:**
   - Should show: `Server running on port 5000`
   - Should NOT show: Module not found errors

3. **Test the Service:**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

### If All Else Fails

1. **Contact Render Support:**
   - Include build logs
   - Include start logs
   - Include your render.yaml file

2. **Try Alternative Platform:**
   - Railway (easier setup)
   - Heroku (paid)
   - DigitalOcean App Platform

