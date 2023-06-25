require('dotenv').config()
const express = require('express')
const cors = require('cors')
const async = require('async')
const multer  = require('multer')
const axios = require('axios')
const bodyParser = require('body-parser')
const googleTTS = require('google-tts-api');

// services
const speech = require('./services/speech')

// secrets
const GPT_URL = process.env.GPT_URL
const PAWAN_API = process.env.PAWAN_API
const PORT = process.env.PORT

const app = express()
const upload = multer({ dest: '.temp/' })

// middlewares
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: true, 
	credentials: true, exposedHeaders: ["set-cookie"],
}));

// local helpers
function createRequest(text) {
    const headers = {
        'Authorization': `Bearer ${PAWAN_API}`,
        'Content-Type': 'application/json'
    }
    const payload = {
        "model": "text-davinci-003",
        "prompt": text,
        "temperature": 0.7,
        "max_tokens": 256,
        "stop": [
            "Human:",
            "AI:"
        ]
    }

    return {
        headers: headers,
        payload: payload
    }
}

// root API
app.get('/', (req, res) => {
    return res.send({result: "OK", info: "Welcome to voiceGPT"})
})


// voiceGPT API
app.post('/api/v1/talk', upload.single('audio'), (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(403).send({error: 'Please attach an audio file!'});
    }
    const { path } = req.file;
    
    async.auto({
        speechToText: (cb) => {
            const audio_response = speech.speechToText(path);
            if (!audio_response.transcript) {
                return cb("Error generating speech to text");
            }
            return cb(null, audio_response.transcript);
        },
        fetchGPTresponse: ['speechToText', (results, cb) => {
            if (!results.speechToText) {
                return cb('Unable to process given audio file');
            }

            const text = results.speechToText || "What is an apple?";
            const { headers, payload } = createRequest(text);
            
            console.log('text: ', text);
            axios.post(GPT_URL, payload, {
                headers: headers
            }).then((response) => {
                if (!response.data) {
                    return cb('Error fetching reply from GPT');
                }
                if (!response.data.choices || !response.data.choices.length) {
                    return cb(null, ['Sorry I don\'t know this one.']);
                }
                return cb(null, response.data.choices);
            }).catch((err) => {
                return cb(err);
            });
        }],
        textToSpeech: ['fetchGPTresponse', (results, cb) => {
            const reply_text = results.fetchGPTresponse;
            // TODO: all responses can be converted to audio response and send to client
            const reply_speech = googleTTS.getAllAudioUrls(reply_text[0].text, {
                lang: 'en',
                slow: false,
                host: 'https://translate.google.com',
                splitPunct: ',.?',
            });

            return cb(null, reply_speech);
        }]
    }, function (err, results) {
        if (err) {
            return res.status(err.status || 400).send({info: 'Unable to process your request', error: err})
        }
        return res.send({result: results.textToSpeech, info: 'Text response for the audio send to GPT'})
    });
})

app.listen(PORT, () => {
    console.log('started voiceGPT server on http://localhost:', PORT);
})