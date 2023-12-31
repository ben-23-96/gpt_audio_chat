require('dotenv').config();

// Import required modules
const { app, ipcMain, BrowserWindow, shell } = require('electron');  // Electron core modules
const convertMicAudioToText = require('./core/micAudioToText');  // Custom module for speech-to-text functionality
const ChatGPTResponse = require('./core/gptResponse')
const TextToSpeech = require('./core/textToSpeech')
const BinPath = require("./build_scripts/addBinToPath")
const path = require('path');  // Node.js path module
const keytar = require('keytar');

// set Google credentials
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = path.join(__dirname, 'credentials.json');

/**
 * Creates a new Electron window and sets up IPC handlers.
 */
const createWindow = () => {
    // Create a new browser window with specified dimensions and configurations
    const win = new BrowserWindow({
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron/preload.js')  // Path to the preload script
        }
    });

    // add sox binaries to path, for use in the packaged version for the windows installer
    if (process.platform === 'win32') {
        const binPath = new BinPath()
        binPath.checkExecutableOnPath()
    }

    const textToSpeech = new TextToSpeech()
    // variable for chatGptResponse class instance
    let chatGptResponse;

    // IPC handler to set the users openai apikey
    ipcMain.handle('set-api-key', async (event, apiKey) => {
        // store the users apikey
        await keytar.setPassword('ChatGUI', 'openAiApiKey', apiKey);
        // set variable to chatgptresponse class instance with user apikey
        chatGptResponse = new ChatGPTResponse(apiKey)
    });

    // IPC handler to retrieve the users api key if it exists and send to the renderer process
    ipcMain.handle('get-api-key', async () => {
        // retrieve the users apikey
        const apiKey = await keytar.getPassword('ChatGUI', 'openAiApiKey');
        if (apiKey === null) {
            console.log('No API Key found.');
        } else {
            // set variable to chatgptresponse class instance with user apikey
            chatGptResponse = new ChatGPTResponse(apiKey)
        }
        return apiKey
    });

    // if api key provided does not work send notifcation to frontend renderer
    ipcMain.on('incorrect-api-key', async () => {
        console.log('incorrect api key in main')
        await keytar.deletePassword('ChatGUI', 'openAiApiKey');
        win.webContents.send('authentication-error')
    })

    // IPC handler to start recording microphone audio and convert it to text when 'record' event is received
    ipcMain.handle('record', convertMicAudioToText);

    // IPC handler to start a new conversation, clears the chat memory
    ipcMain.handle('new-conversation', async (event, arg) => {
        chatGptResponse.clearChatMemory()
    })

    // IPC handler, when audio buffer added to queue on frontend, processes queue on backend to convert text to audio and send to frontend
    ipcMain.handle('process-backend-audio', () => {
        console.log('process-audio in main')
        chatGptResponse.textToSpeech.processQueue()
    })

    // IPC listener for 'mic-audio-transcription-to-main' event from speechToText
    ipcMain.on('mic-audio-transcription-to-main', (event, transcription) => {
        console.log("Received in main:", transcription);

        // Send the transcription to the renderer process
        win.webContents.send('mic-audio-transcription-to-renderer', transcription);
    });

    // when user mic audio ends send transcription to chatgpt and generate a audio response
    ipcMain.on('mic-audio-transcription-complete', (event, completeTranscription) => {
        console.log('audio transcription complete')
        chatGptResponse.generateResponseAudio({ prompt: completeTranscription })
    })

    // send gpt response audio buffer to renderer to be played on frontend
    ipcMain.on('gpt-res-sentence-audio-buffer-to-main', (event, audioBuffer) => {
        console.log('in main', audioBuffer)
        win.webContents.send('gpt-res-sentence-audio-buffer-to-renderer', audioBuffer)
    })

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
