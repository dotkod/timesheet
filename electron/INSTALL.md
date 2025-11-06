# Installation Guide for Timesheet Menu Bar App

## Quick Start

### 1. Install Electron Dependencies

From the project root:
```bash
pnpm electron:install
```

Or manually:
```bash
cd electron
pnpm install
```

### 2. Prepare Icon (Optional but Recommended)

The app will work without an icon, but it's better to have one:

1. Copy an icon to `electron/icon.png` (recommended: 512x512px PNG)
2. For macOS `.icns` file (for the built app), you can:
   - Use online tools like [CloudConvert](https://cloudconvert.com/png-to-icns)
   - Or use macOS `iconutil`:
     ```bash
     # Create iconset directory
     mkdir icon.iconset
     # Copy your icon at different sizes
     cp icon.png icon.iconset/icon_512x512.png
     # Generate .icns
     iconutil -c icns icon.iconset
     ```

### 3. Test the App

Run the app in development mode:
```bash
pnpm electron:dev
```

Or from the electron folder:
```bash
cd electron
pnpm start
```

You should see a menu bar icon. Click it to open the timesheet window.

### 4. Build the macOS App

Build the app:
```bash
pnpm electron:build
```

This will create `electron/dist/Timesheet.app`

### 5. Install on Your Mac

1. Open Finder and navigate to `electron/dist/`
2. Drag `Timesheet.app` to your `/Applications` folder
3. **First Launch**: macOS will warn about an unidentified developer:
   - Right-click `Timesheet.app` → **Open**
   - Click **Open** in the security dialog
   - Or go to **System Settings** → **Privacy & Security** → Scroll to find the app and click **Allow**

### 6. Launch at Startup (Optional)

To have the app launch automatically when you log in:

1. Open **System Settings** → **General** → **Login Items**
2. Click the **+** button
3. Select `Timesheet.app` from `/Applications`

## Troubleshooting

### App won't open / "Damaged" error

If macOS says the app is damaged:

1. Remove the quarantine attribute:
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/Timesheet.app
   ```
2. Try opening again

### No icon in menu bar

- The app is running but the icon might be very small or transparent
- Check Activity Monitor for "Electron" or "Timesheet" process
- Try right-clicking in the menu bar area to see if there's a context menu

### Window doesn't appear

- Click the menu bar icon
- Check if the window appeared off-screen
- Try right-clicking the icon → "Open Timesheet"

### Need to change the URL

Edit `APP_URL` in `electron/main.js` (line 8)

## Development

### Making Changes

1. Edit `electron/main.js`
2. Quit and restart the app to see changes
3. Or use `pnpm electron:dev` for development

### Rebuilding

After making changes:
```bash
pnpm electron:build
```

Then replace the app in `/Applications` with the new build.


