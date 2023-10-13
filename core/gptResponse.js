// Load environment variables from a .env file
require('dotenv').config();

const TextToSpeech = require('./textToSpeech');
const { ConversationChain } = require("langchain/chains");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
const { CallbackManager } = require('langchain/callbacks');
const { ConversationSummaryMemory, } = require("langchain/memory");
const { ipcMain } = require('electron');  // Electron's IPC (Inter-Process Communication) for main process

class ChatGPTResponse {
    constructor(apiKey) {
        // instance of the TextToSpeech class to be used converting the gpt text response to audio
        this.textToSpeech = new TextToSpeech()
        // attribute to accumulate received text
        this.sentenceText = ""
        // bool set to check if is the first sentence of the gpt response
        this.firstSentence = true
        // user openai api key
        this.apiKey = apiKey
        // chat memory store that summarizes previous messages
        this.memory = new ConversationSummaryMemory({
            memoryKey: "chat_history",
            llm: new ChatOpenAI({ openAIApiKey: apiKey, modelName: "gpt-3.5-turbo", temperature: 0 }),
        });
    }

    /**
    * Uses langchain to stream gpt chat responses with conversation memory.
    * The text is accumulated into sentences, after which it's added to a queue to be converted to audio.
    */
    async generateResponseAudio({ prompt }) {

        // function to be called on chatgpt stream response 
        const callbackManager = CallbackManager.fromHandlers({
            handleLLMStart: async () => {
                console.log('start of stream')
                this.firstSentence = true
            },
            handleLLMNewToken: async (token) => {
                console.log(token);
                // add streamed response to sentence
                this.sentenceText += token;
                // If sentence-ending character, add sentence to the queue to be converted to audio and clear sentenceText
                if (this.endOfSentenceCharacters(this.sentenceText)) {
                    console.log('To be sent to text to speech:', this.sentenceText);
                    this.textToSpeech.textQueue.push(this.sentenceText);
                    this.sentenceText = "";
                    // if first sentence begin processing the text to speech conversion queue, set first sentence flag to false
                    if (this.firstSentence) {
                        this.firstSentence = false
                        this.textToSpeech.processQueue()
                    }
                }
            },
            handleLLMEnd: async () => {
                console.log('end of stream')
                this.firstSentence = true
            }
        })
        // create prompt template to be sent to gpt
        const chatPrompt =
            PromptTemplate.fromTemplate(`You are a friendly assistant.

            Current conversation:
            {chat_history}
            Human: {input}
            AI:`);

        try {
            const chat = new ChatOpenAI({ openAIApiKey: this.apiKey, streaming: true, callbackManager });

            const chain = new ConversationChain({
                prompt: chatPrompt,
                llm: chat,
                memory: this.memory
            });

            const aiResponse = await chain.call({
                input: prompt
            });

            this.sentenceText = ""
        } catch (error) {
            console.error(error)
            if (error.code === 'invalid_api_key') {
                console.log('incorrect api key')
                ipcMain.emit('incorrect-api-key');
            }
        }
    }

    /**
     * Checks if the provided string ends with a sentence-ending character.
     */
    endOfSentenceCharacters(str) {
        return /[.!?:]/.test(str);
    }

    /**
     * Clears the chat memory
     */
    async clearChatMemory() {
        await this.memory.clear()
    }
}

module.exports = ChatGPTResponse;