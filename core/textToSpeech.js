// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const textToSpeech = require('@google-cloud/text-to-speech');
const { ipcMain } = require('electron');

// Initialize the Google Cloud Text-to-Speech client
const textToSpeechClient = new textToSpeech.TextToSpeechClient();

class TextToSpeech {
    constructor() {
        // Initialize an empty queue to hold text that needs to be converted to audio
        this.textQueue = [];

        // Flag to indicate whether the queue is currently being processed
        this.isProcessing = false;
    }

    /**
    * Processes the text queue by converting each text to audio.
    * If the queue is already being processed or is empty, it does nothing.
    */
    async processQueue() {
        // If the queue is already being processed, exit the function
        if (this.isProcessing) return;

        // If the queue is empty exit the function
        if (this.textQueue.length === 0) {
            return;
        }
        console.log(this.textQueue);
        // Set the processing flag to true
        this.isProcessing = true;
        // Return and remove the first text from queue
        const text = this.textQueue.shift();
        // Convert text to audio
        this.convertTextToAudio(text);
        // Reset the processing flag to false
        this.isProcessing = false;
        // process next item in queue with recursive call
        await this.processQueue()
    }

    /**
    * Converts the provided text into audio using Google Cloud Text-to-Speech API.
    * @param {string} text - The text to be converted to audio.
    */
    async convertTextToAudio(text) {
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
};

module.exports = TextToSpeech;
