// Import required modules from Electron
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes specific IPC methods to the renderer process using Electron's contextBridge.
 * This ensures a more secure way of communication between the main and renderer processes.
 */
contextBridge.exposeInMainWorld(
    'electronAPI', {  // The name of the object that will be exposed to the renderer process
    /**
     * Sends a request to the main process to start recording.
     */
    record: () => ipcRenderer.invoke('record'),

    /***
     * Sends the users apikey to the main process to be saved.
     */
    setApiKey: async (apiKey) => {
        await ipcRenderer.invoke('set-api-key', apiKey);
    },

    /**
     * returns the users api key if one exists from the main process.
     */
    getApiKey: async () => {
        return await ipcRenderer.invoke('get-api-key');
    },

    /**
     * Sends a request to the main process to clear the conversation history
     */
    newConversation: () => ipcRenderer.invoke('new-conversation'),

    /**
     * Sets up a listener in the renderer process for transcriptions from the main process to be transcriped in the gui.
     */
    onTranscription: (callback) => {
        ipcRenderer.on('mic-audio-transcription-to-renderer', (event, transcription) => {
            console.log("Received in renderer:", transcription);
            callback(transcription);  // Execute the provided callback with the received transcription
        });
    },
    /**
     * Sets up a listener in the renderer process for audio buffers from the main process to be played in the gui.
     */
    onAudioBuffer: (callback) => {
        ipcRenderer.on('gpt-res-sentence-audio-buffer-to-renderer', (event, audioBuffer) => {
            console.log("Received in renderer:", audioBuffer);
            callback(audioBuffer);  // Execute the provided callback with the received transcription
        });
    },
    /**
     * sends a request to main to send the next sentence audio buffer to renderer
     */
    processBackendAudioQueue: () => ipcRenderer.invoke('process-backend-audio'),
    /**
     * if openai api key has not authenticated correctly trigger callback to notify user
     */
    onAuthenticationError: (callback) => {
        ipcRenderer.on('authentication-error', () => {
            console.log('in renderer incorrect api key')
            callback()
        })
    }
}
);
