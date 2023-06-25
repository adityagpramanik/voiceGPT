# VoiceGPT

Below project is an application of open ai's chat GPT. This is an voice chat web app which gets audio input from user and then uses Picovoice to convert the audio into text and then sends the converted text as query to chat GPT endpoint from where the application recieves some replies and one of the replies which is next format is then converted into audio using google tts endpoint.

## File structure
**voicegpt-server**

This directory contains the node express server.

*app.js* is the server application and *services/* contains speech service which utilises PicoVoice to convert audio into text.

**voicegpt-client**

This directory contains the client (basic HTML interface) to interact with the server.

*index.html* is the single file client, which contains the frontend HTML code with it's styling and functionality altogether.

## How to start VoiceGPT?

This will help you setting up the application in any system.

### Setting **.env** with required credentials (API Keys and other sensitive information)
```
PORT=<Any-Port>

PICOVOICE_STT_API=<Your-API-Key-from-PicoVoice>

GPT_API=<Your-API-Key-from-PicoVoice>

PAWAN_API=<Your-API-Key-from-PicoVoice>
```

[Get GPT API](https://platform.openai.com/account/api-keys)

[Get Pawan API Key](https://github.com/PawanOsman/ChatGPT) (alternative of chat GPT)

[Get PicoVoice API](https://picovoice.ai/)

### Checking out to correct branch
The project has two main branches
1. master
2. gpt-alternative-api

`master` branch is written for chatGPT integration where as `gpt-alternative-api` branch contains code for Pawan GPT (alternative of chatGPT)

### Commands
To start the server change directory to voicegpt-server:

`npm run serve` or `nodemon api.js`

### Client Side
This is a very simple interface with 3 buttons:
1. Record
2. Stop
3. Save

Record - This starts capturing the sound from mic

Stop - This stops recording

Save - This creates a audio chat in chat box and create an request to server

This is it, wait for a while and boom there's your response.