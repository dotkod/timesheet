# Quick Start - Timesheet Menu Bar App

## One-Time Setup

```bash
# Install Electron dependencies
pnpm electron:install
```

## Development

```bash
# Run the app (test it)
pnpm electron:dev
```

Click the menu bar icon to open the timesheet window.

## Build & Install

```bash
# Build the macOS app
pnpm electron:build
```

Then:
1. Open `electron/dist/` folder
2. Drag `Timesheet.app` to `/Applications`
3. First launch: Right-click → Open (to bypass macOS security)

## Features

- ✅ Menu bar icon (click to toggle window)
- ✅ Loads https://ts.dotkod.com/
- ✅ Window positioning (near menu bar)
- ✅ Context menu (right-click icon)
- ✅ No App Store needed (run locally)

For detailed instructions, see [INSTALL.md](./INSTALL.md)


