// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const axios = require('axios');
const { audioStream, convertTextToAudio } = require('./textToSpeech');

// Initialize an empty queue to hold text that needs to be converted to audio
let textQueue = [];

// Flag to indicate whether the queue is currently being processed
let isProcessing = false;

/**
 * Checks if the provided string ends with a sentence-ending character.
 */
function endOfSentenceCharacters(str) {
    return /[.!?:]/.test(str);
}

/**
 * Processes the text queue by converting each text to audio.
 * If the queue is empty, it ends the audio stream.
 * If the queue is already being processed, it does nothing.
 */
async function processQueue() {
    // If the queue is already being processed, exit the function
    if (isProcessing) return;

    // If the queue is empty, end the audio stream and exit the function
    if (textQueue.length === 0) {
        audioStream.end();
        return;
    }

    // Set the processing flag to true
    isProcessing = true;

    // Take the first text from the queue and convert it to audio
    const text = textQueue.shift();
    await convertTextToAudio(text);

    // Reset the processing flag to false
    isProcessing = false;

    // Recursively call the function to process the next text in the queue
    processQueue();
}


/**
 * Streams responses from the OpenAI GPT-3 API and processes the received text.
 * The text is accumulated into sentences, after which it's added to a queue to be converted to audio.
 */
async function streamGPTResponse() {
    // Define the API endpoint and retrieve the API key from environment variables
    const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    const API_KEY = process.env.OPENAI_API_KEY;

    // Variable to accumulate received text
    let sentenceText = "";

    // Define headers for the API request
    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
    };

    // Define the data payload for the API request
    const data = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'user', content: 'tell me a joke about ducks' }
        ],
        stream: true
    };

    // Make a POST request to the OpenAI API
    axios.post(API_ENDPOINT, data, { headers: headers, responseType: 'stream' })
        .then(response => {
            // Process the streamed data
            response.data.on('data', chunk => {
                // Split the chunk into the data for a single word
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    // Remove the "data: " prefix from each line
                    const chunkJsonString = line.replace(/^data: /, '');

                    // If the line indicates the end of the stream, process any remaining text
                    if (chunkJsonString === '[DONE]') {
                        console.log('Stream complete.');
                        if (sentenceText) {
                            console.log('To be sent to text to speech:', sentenceText);
                            sentenceText = "";
                        }
                        return;
                    }

                    // Parse the JSON string to extract the content
                    const parsedChunk = JSON.parse(chunkJsonString);
                    const wordText = parsedChunk.choices[0].delta.content;

                    // append words into sentences
                    if (wordText) {
                        sentenceText += wordText;
                    }

                    // If sentence-ending character, add sentence to the queue to be converted to audio and clear sentenceText
                    if (endOfSentenceCharacters(sentenceText)) {
                        console.log('To be sent to text to speech:', sentenceText);
                        textQueue.push(sentenceText);
                        processQueue();
                        sentenceText = "";
                    }
                }
            });
        })
        .catch(error => {
            // Log any errors that occur during the API request
            console.error('Error:', error);
        });
}

// Call the function to start streaming responses
streamGPTResponse();
