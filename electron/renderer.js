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
