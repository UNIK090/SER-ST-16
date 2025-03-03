// Get the record and stop buttons
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const predictButton = document.getElementById('predictButton');

// Create a MediaStream object to access the user's microphone input
let mediaStream = null;
let audioContext = null;
let source = null;
let gainNode = null;
let analyser = null;
let audioData = [];

// Function to start recording
function startRecording() {
    // Create a MediaStream object
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaStream = stream;
            audioContext = new AudioContext();
            source = audioContext.createMediaStreamSource(stream);
            gainNode = audioContext.createGain();
            analyser = audioContext.createAnalyser();
            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            // Start recording audio data
            analyser.fftSize = 256;
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            function record() {
                analyser.getByteFrequencyData(frequencyData);
                audioData.push(frequencyData);
                requestAnimationFrame(record);
            }
            record();
        })
        .catch(error => console.error('Error starting recording:', error));
}

// Function to stop recording
function stopRecording() {
    // Stop recording audio data
    mediaStream.getTracks().forEach(track => track.stop());
    audioContext.close();
}

// Function to predict emotion
function predictEmotion() {
    // Convert audio data to a format suitable for the model
    const audioDataArray = new Float32Array(audioData.length * audioData[0].length);
    for (let i = 0; i < audioData.length; i++) {
        for (let j = 0; j < audioData[i].length; j++) {
            audioDataArray[i * audioData[i].length + j] = audioData[i][j] / 255;
        }
    }

    // Send the audio data to the server for prediction
    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: audioDataArray }),
    })
        .then(response => response.json())
        .then(data => {
            const emotion = data.emotion;
            const probabilities = data.probabilities;
            console.log(`Predicted emotion: ${emotion}`);
            console.log(`Probabilities: ${JSON.stringify(probabilities)}`);
        })
        .catch(error => console.error('Error predicting emotion:', error));
}

// Add event listeners to the buttons
recordButton.addEventListener('click', () => {
    startRecording();
    recordButton.style.display = 'none';
    stopButton.style.display = 'block';
});

stopButton.addEventListener('click', () => {
    stopRecording();
    recordButton.style.display = 'block';
    stopButton.style.display = 'none';
});

predictButton.addEventListener('click', predictEmotion);