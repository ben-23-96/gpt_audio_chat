// Import required modules
const { app, ipcMain, BrowserWindow } = require('electron');  // Electron core modules
const convertMicAudioToText = require('./core/micAudioToText');  // Custom module for speech-to-text functionality
const path = require('path');  // Node.js path module

/**
 * Creates a new Electron window and sets up IPC handlers.
 */
const createWindow = () => {
    // Create a new browser window with specified dimensions and configurations
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'electron/preload.js')  // Path to the preload script
        }
    });

    // IPC handler to start recording microphone audio and convert it to text when 'record' event is received
    ipcMain.handle('record', convertMicAudioToText);

    // IPC listener for 'audio-transcription-to-main' event from speechToText
    ipcMain.on('audio-transcription-to-main', (event, transcription) => {
        console.log("Received in main:", transcription);

        // Send the transcription to the renderer process
        win.webContents.send('audio-transcription-to-renderer', transcription);
    });

    // Load the main HTML file into the window
    win.loadFile('electron/index.html');
};

// When Electron app is ready, create the main window
app.whenReady().then(() => {
    createWindow();

    // If the app is activated and no windows are open, create a new window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
