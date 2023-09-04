// Add an event listener to the element with the ID 'startRecording'
// When the element is clicked, the record function from the electronAPI is triggered
document.getElementById('startRecording').addEventListener('click', () => {
    window.electronAPI.record();
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






