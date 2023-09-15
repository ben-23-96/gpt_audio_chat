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

let audioContext = new AudioContext();
let audioQueue = [];
let isPlaying = false;

window.electronAPI.onAudioBuffer(async (audioData) => {
    // add audio buffer to queue
    audioQueue.push(audioData);
    // If not currently playing, start playback
    if (!isPlaying) {
        playAudio();
    }
});

async function playAudio() {

    isPlaying = true;
    const audioData = audioQueue.shift();
    const audioBuffer = await audioContext.decodeAudioData(audioData.audioContent.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

    // When the audio finishes playing, check if there's more audio to play
    source.onended = () => {
        if (audioQueue.length > 0) {
            playAudio();
        } else {
            isPlaying = false;
        }
    };
}

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




