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

    /**
     * Sets up a listener in the renderer process for transcriptions from the main process.
     */
    onTranscription: (callback) => {
        ipcRenderer.on('audio-transcription-to-renderer', (event, transcription) => {
            console.log("Received in renderer:", transcription);
            callback(transcription);  // Execute the provided callback with the received transcription
        });
    },
}
);
