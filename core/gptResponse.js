// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const axios = require('axios');
const TextToSpeech = require('./textToSpeech');

// Define the API endpoint and retrieve the API key from environment variables
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.OPENAI_API_KEY;

class ChatGPTResponse {
    constructor() {
        // instance of the TextToSpeech class to be used converting the gpt text response to audio
        this.textToSpeech = new TextToSpeech()
        //  attribute to accumulate received text
        this.sentenceText = ""
    }

    /**
    * Streams responses from the OpenAI GPT-3 API and processes the received text.
    * The text is accumulated into sentences, after which it's added to a queue to be converted to audio.
    */
    async generateResponseAudio({ prompt }) {

        // Define headers for the API request
        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        };

        // Define the data payload for the API request
        const data = {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: prompt }
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
                            if (this.sentenceText) {
                                //console.log('To be sent to text to speech:', sentenceText);
                                this.sentenceText = "";
                            }
                            return;
                        }

                        // Parse the JSON string to extract the content
                        const parsedChunk = JSON.parse(chunkJsonString);
                        const wordText = parsedChunk.choices[0].delta.content;

                        // append words into sentences
                        if (wordText) {
                            this.sentenceText += wordText;
                        }

                        // If sentence-ending character, add sentence to the queue to be converted to audio and clear sentenceText
                        if (endOfSentenceCharacters(this.sentenceText)) {
                            console.log('To be sent to text to speech:', this.sentenceText);
                            // add sentence to queue and process queue and clear sentence text
                            this.textToSpeech.textQueue.push(this.sentenceText)
                            this.sentenceText = "";
                            this.textToSpeech.processQueue()
                        }
                    }
                });
            })
            .catch(error => {
                // Log any errors that occur during the API request
                console.error('Error:', error);
            });
    }

    /**
     * Checks if the provided string ends with a sentence-ending character.
     */
    endOfSentenceCharacters(str) {
        return /[.!?:]/.test(str);
    }
}

module.exports = ChatGPTResponse;