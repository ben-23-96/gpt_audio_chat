// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

// Create a writable stream to append audio content to 'output.mp3'
const audioStream = fs.createWriteStream('output.mp3', { flags: 'a' });

// Initialize the Google Cloud Text-to-Speech client
const textToSpeechClient = new textToSpeech.TextToSpeechClient();

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

    // Append the audio content from the response to 'output.mp3'
    audioStream.write(response.audioContent);
    console.log(`Appended audio content for: ${text}`);
}

// Export the audio stream and the convertTextToAudio function
module.exports = {
    audioStream: audioStream,
    convertTextToAudio: convertTextToAudio
};
