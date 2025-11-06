const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window
let mainWindow = null;

const APP_URL = 'https://ts.dotkod.com/login';
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: true,
    frame: true,
    resizable: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: true
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // Load the deployed app
  console.log('Loading URL:', APP_URL);
  mainWindow.loadURL(APP_URL).catch((error) => {
    console.error('Failed to load URL:', error);
  });

  // Debug: Log when page loads
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    console.log('Current URL:', mainWindow.webContents.getURL());
  });

  // Debug: Log errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load - Code:', errorCode, 'Description:', errorDescription, 'URL:', validatedURL);
  });

  // Handle navigation - allow the app to navigate after login
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https://ts.dotkod.com')) {
      console.log('Navigating to:', url);
      // Allow navigation within the same domain
    } else {
      // Block external navigations, open in browser instead
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App lifecycle
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // Focus existing window
      mainWindow?.focus();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
