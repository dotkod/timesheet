# Timesheet Electron Menu Bar App

A macOS menu bar application for the Timesheet web app.

## Setup

1. Install dependencies:
```bash
cd electron
pnpm install
```

2. Create icons (optional but recommended):
   - Copy `icon-512x512.png` from `../public/icons/` to `electron/icon.png`
   - Or create your own icon (recommended: 512x512px PNG)
   - For macOS `.icns` file, you can use online tools or:
     ```bash
     # Install iconutil (comes with macOS)
     iconutil -c icns icon.iconset
     ```

3. Run the app in development:
```bash
pnpm start
```

## Building for macOS

Build the macOS app:
```bash
pnpm build:mac
```

This will create a `.app` file in the `electron/dist` folder.

## Installation

1. After building, navigate to `electron/dist/`
2. Drag `Timesheet.app` to your `/Applications` folder
3. On first launch, macOS may warn about an unidentified developer:
   - Right-click the app → Open
   - Or go to System Settings → Privacy & Security → Allow

## Usage

- Click the menu bar icon to open the timesheet popover
- The app loads your deployed site at https://ts.dotkod.com/
- Click the icon again to hide the window
- Right-click the icon for a context menu

## Configuration

To change the URL, edit `APP_URL` in `electron/main.js`.


