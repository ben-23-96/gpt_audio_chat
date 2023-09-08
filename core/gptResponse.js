// Load environment variables from a .env file
require('dotenv').config();

const TextToSpeech = require('./textToSpeech');
const { ConversationChain } = require("langchain/chains");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
} = require("langchain/prompts");
const { CallbackManager } = require('langchain/callbacks');
const { BufferMemory } = require("langchain/memory");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");

class ChatGPTResponse {
    constructor() {
        // instance of the TextToSpeech class to be used converting the gpt text response to audio
        this.textToSpeech = new TextToSpeech()
        // attribute to accumulate received text
        this.sentenceText = ""
    }

    async generateResponseAudio({ prompt }) {
        const callbackManager = CallbackManager.fromHandlers({
            // Use an arrow function to capture the `this` context
            handleLLMNewToken: async (token) => {
                console.log(token);
                this.sentenceText += token;

                if (this.endOfSentenceCharacters(this.sentenceText)) {
                    console.log('To be sent to text to speech:', this.sentenceText);
                    this.textToSpeech.textQueue.push(this.sentenceText);
                    this.sentenceText = "";
                    this.textToSpeech.processQueue();
                }
            }
        })

        const chatPrompt = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(
                "You are a friendly assistant."
            ),
            //new MessagesPlaceholder("history"),
            HumanMessagePromptTemplate.fromTemplate("{input}"),
        ]);

        const chat = new ChatOpenAI({ streaming: true, callbackManager, });

        const chain = new ConversationChain({
            prompt: chatPrompt,
            llm: chat,
        });

        const res = await chain.call({
            input: prompt,
        });

        console.log(res)
        console.log('testing')
        this.sentenceText = ""
    }

    /**
     * Checks if the provided string ends with a sentence-ending character.
     */
    endOfSentenceCharacters(str) {
        return /[.!?:]/.test(str);
    }
}

module.exports = ChatGPTResponse;