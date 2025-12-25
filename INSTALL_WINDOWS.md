# Installing FFmpeg and FluidSynth on Windows

This guide will help you install FFmpeg and FluidSynth on Windows for audio export functionality.

## Method 1: Using Chocolatey (Recommended - Easiest)

If you have Chocolatey package manager installed:

```powershell
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install FFmpeg
choco install ffmpeg -y

# Install FluidSynth
choco install fluidsynth -y
```

## Method 2: Manual Installation

### Installing FFmpeg

1. **Download FFmpeg:**
   - Go to https://www.gyan.dev/ffmpeg/builds/
   - Download the "ffmpeg-release-essentials.zip" (or latest version)
   - Or use direct link: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip

2. **Extract the ZIP file:**
   - Extract to a location like `C:\ffmpeg`
   - You should have a folder structure like: `C:\ffmpeg\bin\ffmpeg.exe`

3. **Add to PATH:**
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", then click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click "OK" on all dialogs

4. **Verify installation:**
   ```powershell
   ffmpeg -version
   ```

### Installing FluidSynth

1. **Download FluidSynth:**
   - Go to https://github.com/FluidSynth/fluidsynth/releases
   - Download the latest Windows installer (e.g., `fluidsynth-2.x.x-win64.exe`)
   - Or download the ZIP version

2. **Install FluidSynth:**
   - **If using installer:** Run the installer and follow the prompts
   - **If using ZIP:** Extract to `C:\fluidsynth` and add `C:\fluidsynth\bin` to PATH

3. **Add to PATH (if not done automatically):**
   - Follow the same PATH steps as FFmpeg
   - Add: `C:\fluidsynth\bin` (or wherever you installed it)

4. **Verify installation:**
   ```powershell
   fluidsynth --version
   ```

### Installing SoundFont (Required for FluidSynth)

1. **Download a SoundFont:**
   - Go to https://member.keyfax.com/downloads/fluid-soundfont/
   - Download "FluidR3_GM.sf2" (General MIDI SoundFont)
   - Or use: https://sourceforge.net/projects/fluidsynth/files/FluidR3_GM2-2.SF2/download

2. **Place SoundFont:**
   - Create a folder: `C:\soundfonts`
   - Place the `.sf2` file there (e.g., `C:\soundfonts\FluidR3_GM.sf2`)

3. **Configure Environment Variable (Optional):**
   - Add environment variable `SOUNDFONT_PATH` pointing to your soundfont
   - Or the application will look in common locations

## Method 3: Using Scoop (Alternative Package Manager)

If you prefer Scoop:

```powershell
# Install Scoop (if not installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install FFmpeg
scoop install ffmpeg

# Install FluidSynth
scoop install fluidsynth
```

## Verifying Installation

After installation, verify both tools work:

```powershell
# Check FFmpeg
ffmpeg -version

# Check FluidSynth
fluidsynth --version
```

## Testing the Installation

1. **Restart your terminal/PowerShell** after adding to PATH
2. **Restart your Node.js server** if it's running
3. **Try exporting a project** to MP3 or WAV in the application

## Troubleshooting

### "ffmpeg is not recognized"
- Make sure you added FFmpeg to PATH
- Restart your terminal/PowerShell
- Restart your Node.js server

### "fluidsynth is not recognized"
- Make sure you added FluidSynth to PATH
- Restart your terminal/PowerShell
- Restart your Node.js server

### "SoundFont not found"
- Download a SoundFont file (`.sf2`)
- Set environment variable `SOUNDFONT_PATH` to the full path of your soundfont
- Or place it in: `C:\soundfonts\FluidR3_GM.sf2`

### Setting SOUNDFONT_PATH Environment Variable

1. Press `Win + X` → "System" → "Advanced system settings"
2. Click "Environment Variables"
3. Under "User variables" or "System variables", click "New"
4. Variable name: `SOUNDFONT_PATH`
5. Variable value: `C:\soundfonts\FluidR3_GM.sf2` (or your path)
6. Click "OK" on all dialogs
7. **Restart your Node.js server**

## Quick Test Commands

Test FFmpeg:
```powershell
ffmpeg -i input.mid output.wav
```

Test FluidSynth:
```powershell
fluidsynth -F output.wav input.mid C:\soundfonts\FluidR3_GM.sf2
```

## Alternative: Portable Versions

If you don't want to modify PATH, you can:

1. Download portable versions
2. Place them in your project folder (e.g., `server/tools/`)
3. Update `server/services/exportService.js` to use full paths:
   ```javascript
   const ffmpegPath = path.join(__dirname, '../tools/ffmpeg.exe');
   const fluidsynthPath = path.join(__dirname, '../tools/fluidsynth.exe');
   ```

## Need Help?

If you encounter issues:
1. Check that both tools are in your PATH
2. Restart your terminal and Node.js server
3. Verify with `ffmpeg -version` and `fluidsynth --version`
4. Check server logs for specific error messages

