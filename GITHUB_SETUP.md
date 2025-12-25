# GitHub Setup Commands

Follow these commands to push your project to GitHub.

## Step 1: Initialize Git Repository

```powershell
# Navigate to project directory
cd C:\Users\ar233\OneDrive\Desktop\spotmies_ai

# Initialize git repository
git init

# Check status
git status
```

## Step 2: Add All Files

```powershell
# Add all files to staging
git add .

# Verify what will be committed
git status
```

## Step 3: Create Initial Commit

```powershell
# Create initial commit
git commit -m "Initial commit: Collaborative MIDI composition platform with AI harmonization"
```

## Step 4: Create GitHub Repository

**Option A: Using GitHub Web Interface (Recommended)**
1. Go to https://github.com/new
2. Repository name: `spotmies_ai` (or your preferred name)
3. Description: "Collaborative MIDI composition platform with AI harmonization"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

**Option B: Using GitHub CLI (if installed)**
```powershell
# Create repository using GitHub CLI
gh repo create spotmies_ai --public --description "Collaborative MIDI composition platform with AI harmonization"
```

## Step 5: Add Remote and Push

After creating the repository on GitHub, you'll get a URL like:
- `https://github.com/YOUR_USERNAME/spotmies_ai.git` (HTTPS)
- `git@github.com:YOUR_USERNAME/spotmies_ai.git` (SSH)

**Replace `YOUR_USERNAME` with your actual GitHub username in the commands below:**

```powershell
# Add remote repository (HTTPS - easier for first time)
git remote add origin https://github.com/YOUR_USERNAME/spotmies_ai.git

# Or if you prefer SSH (requires SSH key setup):
# git remote add origin git@github.com:YOUR_USERNAME/spotmies_ai.git

# Verify remote was added
git remote -v

# Rename default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 6: Update README with Repository URL

After pushing, update the README.md to replace `<repository-url>` with your actual GitHub URL.

## Troubleshooting

### If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys for easier authentication

### If branch name is 'master' instead of 'main':
```powershell
git branch -M main
git push -u origin main
```

### If you need to update the remote URL later:
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/spotmies_ai.git
```

