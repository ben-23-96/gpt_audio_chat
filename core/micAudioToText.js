// Import required modules
const recorder = require('node-record-lpcm16');  // Module for recording audio
const speech = require('@google-cloud/speech');  // Google Cloud Speech-to-Text API client
const { ipcMain } = require('electron');  // Electron's IPC (Inter-Process Communication) for main process

// Initialize the Google Cloud Speech client
const client = new speech.SpeechClient();

/**
 * Starts recording audio and transcribes it using Google Cloud Speech-to-Text API.
 * The function will stop recording after an initial 15 seconds of silence or 4 seconds after user audio.
 * Transcriptions are sent to the renderer process via IPC.
 */
async function convertMicAudioToText() {
    console.log('recording triggered');

    // Configuration for the Google Cloud Speech-to-Text API request
    const request = {
        config: {
            encoding: 'LINEAR16',  // Linear PCM encoding
            sampleRateHertz: 16000,  // Sample rate of the audio
            languageCode: 'en-US',  // Language code for transcription
        },
        interimResults: false,  // Only final results are required
    };

    let completeMicrophoneTranscript = ""

    // Set a timeout to end recording after 15 seconds of inital silence
    let silenceTimeout = setTimeout(() => {
        audioStream.end();
    }, 15000);

    // Create a streaming recognition request to Google Cloud Speech-to-Text API
    const recognizeStream = client
        .streamingRecognize(request)
        .on('data', data => {
            // Check if there's a valid transcription result
            if (data.results && data.results[0] && data.results[0].alternatives[0]) {
                const transcription = data.results[0].alternatives[0].transcript + "";
                console.log('speechToTextOutput:  ', transcription);

                // Send the transcription to the main via IPC where it will be sent to renderer
                ipcMain.emit('audio-transcription-to-main', null, transcription);
                completeMicrophoneTranscript += transcription

                // Clear the previous silence timeout and set a new one for 4 seconds
                clearTimeout(silenceTimeout);
                silenceTimeout = setTimeout(() => {
                    console.log('end triggered');
                    audioStream.end();
                }, 3000);
            }
        })
        .on('error', error => {
            // Log any errors that occur during transcription
            console.error('Error:', error);
        })
        .on('end', () => {
            // Clear the silence timeout when the recognition stream ends
            clearTimeout(silenceTimeout);
            // Send complete audio transcript to be sent as prompt to gpt 
            ipcMain.emit('audio-transcription-complete', null, completeMicrophoneTranscript)
            console.log('ended');
            console.log('micAudioToText full transcript:\n', completeMicrophoneTranscript)
        });

    // Start recording audio with the specified configuration
    const audioStream = recorder.record({
        sampleRateHertz: 16000,
        recordProgram: 'sox',  // Use 'sox' for recording
    }).stream();

    // Pipe the audio stream to the Google Cloud Speech-to-Text API
    audioStream.pipe(recognizeStream);
};

// Export the startRecording function
module.exports = convertMicAudioToText;

