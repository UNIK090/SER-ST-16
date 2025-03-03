from flask import Flask, request, jsonify, render_template
from tensorflow.keras.models import load_model
import librosa
import numpy as np
import os

app = Flask(__name__)

# Load the trained model
model = load_model("emotion_recognition_model.h5")

# Emotion labels
emotions = ["neutral", "calm", "happy", "sad", "angry", "fearful", "surprised", "excited"]

# Home route
@app.route('/')
def index():
    return render_template("index.html")

# API route for emotion prediction
@app.route('/predict', methods=['POST'])
def predict_emotion():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    try:
        # Load the audio file
        signal, sr = librosa.load(file, sr=22050)
        
        # Ensure consistent duration
        max_duration = 3  # seconds
        max_length = sr * max_duration
        if len(signal) > max_length:
            signal = signal[:max_length]
        else:
            signal = np.pad(signal, (0, max_length - len(signal)))

        # Extract MFCC features
        mfcc = librosa.feature.mfcc(y=signal, sr=sr, n_mfcc=40)  # Increase n_mfcc
        mfcc_scaled = np.mean(mfcc.T, axis=0).reshape(1, -1)

        # Debugging: Print the MFCC shape
        print("MFCC Shape:", mfcc_scaled.shape)

        # Get prediction probabilities
        prediction = model.predict(mfcc_scaled)
        print("Prediction Raw Output:", prediction)  # Debugging line

        # Get the predicted emotion
        emotion_index = np.argmax(prediction)
        emotion = emotions[emotion_index]

        return jsonify({'emotion': emotion, 'probabilities': {emotions[i]: float(prediction[0][i]) for i in range(len(emotions))}})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)