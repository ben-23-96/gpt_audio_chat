# AI Voice Assistant

A GUI built using electron. It captures an audio prompt from the user via a microphone and streams to Google Cloud Speech-to-Text API to transcribe it into text. The resulting text prompt is then sent to the OpenAI API using the Langchain framework. The assistant has working conversation memory. The AI-generated response is streamed back and the application converts the text response into audio using the Google Cloud Text-to-Speech API. The AI response is then played to the user as audio within the GUI.

## Prerequisites

To run this application, you need to install SoX and ensure it is available in your $PATH.

### For Mac OS

```
brew install sox
```
### For most linux disto's
```
sudo apt-get install sox libsox-fmt-all
```
### For Windows
Working version for Windows is 14.4.1. You can download the binaries or use chocolately to install the package
```
choco install sox.portable
```

Then to run
```
npm start
```
