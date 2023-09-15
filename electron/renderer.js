// Add an event listener to the element with the ID 'startRecording'
// When the element is clicked, the record function from the electronAPI is triggered
document.getElementById('startRecordingButton').addEventListener('click', () => {
    window.electronAPI.record();
});

document.getElementById('newConversationButton').addEventListener('click', () => {
    window.electronAPI.newConversation();
});

// Set up a listener for transcriptions from the electronAPI
// When a transcription is received, it's appended to the element with the ID 'transcriptionOutput'
window.electronAPI.onTranscription((transcription) => {
    document.getElementById('transcriptionOutput').innerText += transcription;
});

/***
 * Load either form to submit openai api key or main gui page depending on if apikey alreasy exists on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    const apiFormContainer = document.getElementById('api-key-form-container');
    const mainGuiContainer = document.getElementById('main-gui-container');
    const form = document.getElementById('api-form');

    // Check for existing API key
    const existingApiKey = await window.electronAPI.getApiKey()

    if (existingApiKey) {
        // If API key exists, hide form and show main GUI
        mainGuiContainer.style.display = 'block';
    } else {
        // If API key doesn't exist, show form
        apiFormContainer.style.display = 'block';
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        console.log('test')
        e.preventDefault();
        const apiKey = document.getElementById('api-key').value;

        // set the API key
        await window.electronAPI.setApiKey(apiKey);

        // Hide form and show main GUI after saving API key
        apiFormContainer.style.display = 'none';
        mainGuiContainer.style.display = 'block';
    });
});

/**
 * AudioPlayer class for playing audio and visualizing audio data.
 */
class AudioPlayer {
    /**
     * Constructor initializes audio context, analyser, and other properties.
     */
    constructor() {
        // Initialize the audio context
        this.audioContext = new AudioContext();

        // Create an analyser node
        this.analyser = this.audioContext.createAnalyser();

        // Initialize the queue to hold audio data
        this.audioQueue = [];

        // Flag to indicate if audio is currently playing
        this.isPlaying = false;

        // Get the canvas element and its context for visualization
        this.canvas = document.getElementById('canvas');
        this.canvasCtx = this.canvas.getContext('2d');
    }

    /**
     * Play audio from the queue and visualize it.
     */
    async playAudio() {
        // Set the playing flag to true
        this.isPlaying = true;

        // Dequeue the next audio data from the queue
        const audioData = this.audioQueue.shift();

        // Decode the audio data to an audio buffer
        const audioBuffer = await this.audioContext.decodeAudioData(audioData.audioContent.buffer);

        // Create a buffer source node
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        // Connect the source to the analyser and the analyser to the destination
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Start playing the audio
        source.start(0);

        // Start the visualizer
        this.visualizer();

        // Event handler for when the audio finishes playing
        source.onended = () => {
            // Check if there's more audio to play in the queue
            if (this.audioQueue.length > 0) {
                this.playAudio();
            } else {
                // Set the playing flag to false if the queue is empty
                this.isPlaying = false;
            }
        };
    }

    /**
     * Visualize the audio data on a canvas.
     */
    visualizer() {
        // Get canvas dimensions
        let WIDTH = this.canvas.width;
        let HEIGHT = this.canvas.height;

        // Set FFT size for the analyser node
        this.analyser.fftSize = 256;

        // Get the frequency bin count and create a data array
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Clear the canvas
        this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        // Function to draw the visualization
        const draw = () => {
            // Request animation frame for smooth visualization
            let drawVisual = requestAnimationFrame(draw);

            // Get the frequency data into the array
            this.analyser.getByteFrequencyData(dataArray);

            // Draw the background
            this.canvasCtx.fillStyle = "rgb(0, 0, 0)";
            this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            // Calculate the bar width
            const barWidth = (WIDTH / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Draw each bar
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                // Set the color based on the bar height
                this.canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";

                // Draw the bar
                this.canvasCtx.fillRect(
                    x,
                    HEIGHT - barHeight / 2,
                    barWidth,
                    barHeight / 2
                );

                // Move to the next x position
                x += barWidth + 1;
            }
        };

        // Start drawing
        draw();
    }
}


// create instance of AudioPlayer class
const audioPlayer = new AudioPlayer()

// Handle audio buffer when recieved from main process
window.electronAPI.onAudioBuffer(async (audioData) => {
    // add audio buffer to queue
    audioPlayer.audioQueue.push(audioData);
    // If not currently playing, start playback
    if (!audioPlayer.isPlaying) {
        audioPlayer.playAudio();
    }
});