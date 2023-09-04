// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const textToSpeech = require('@google-cloud/text-to-speech');
const { ipcMain } = require('electron');


// Initialize the Google Cloud Text-to-Speech client
const textToSpeechClient = new textToSpeech.TextToSpeechClient();

// Initialize an empty queue to hold text that needs to be converted to audio
let textQueue = [];

// Flag to indicate whether the queue is currently being processed
let isProcessing = false;

/**
 * Processes the text queue by converting each text to audio.
 * If the queue is empty, it ends the audio stream.
 * If the queue is already being processed, it does nothing.
 */
async function processQueue() {
    // If the queue is already being processed, exit the function
    if (isProcessing) return;

    // If the queue is empty exit the function
    if (textQueue.length === 0) {
        return;
    }

    console.log(textQueue)

    // Set the processing flag to true
    isProcessing = true;

    // Return and remove the first text from queue
    const text = textQueue.shift();
    // Convert text to audio
    await convertTextToAudio(text);

    // Reset the processing flag to false
    isProcessing = false;

    // process next item in queue with recursive call
    processQueue()
}


/**
 * Converts the provided text into audio using Google Cloud Text-to-Speech API.
 * 
 * @param {string} text - The text to be converted to audio.
 */
async function convertTextToAudio(text) {
    console.log('Synth text: ', text);

    // Configuration for the Google Cloud Text-to-Speech API request
    const request = {
        input: { text: text },
        voice: {
            languageCode: 'en-US',  // Language code for the voice
            ssmlGender: 'FEMALE',   // Gender of the voice
            name: 'en-US-Wavenet-C' // Specific voice model
        },
        audioConfig: { audioEncoding: 'MP3' },  // Output audio format
        responseType: 'stream'  // Response type as stream
    };

    // Send the request to the Text-to-Speech API and get the response
    const [response] = await textToSpeechClient.synthesizeSpeech(request);

    console.log('API Response:', response);

    // send reponse containing audio buffer to main.js where it can be sent to frontend renderer.js
    ipcMain.emit('gpt-res-sentence-audio-buffer-to-main', null, response)
}

module.exports = {
    textQueue: textQueue,
    processQueue: processQueue,
    convertTextToAudio: convertTextToAudio,
};
