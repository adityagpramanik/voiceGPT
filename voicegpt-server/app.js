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

// global vars
const GPT_URL = 'https://api.openai.com/v1/chat/completions'

// secrets
const GPT_API = process.env.GPT_API
const GPT_ORG = process.env.GPT_ORG
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
        'Authorization': `Bearer ${GPT_API}`,
        'Content-Type': 'application/json'
    }
    const payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{
            "role": "user",
            "content": "Say this is a test!"
        }],
        "temperature": 0.7
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
    const debug = true;
    if (!req.file || !req.file.path) {
        return res.status(403).send({error: 'Please attach an audio file!'});
    }
    const { path } = req.file;
    
    async.auto({
        speechToText: (cb) => {
            if (debug) {
                return cb(null, false);
            }
            const audio_response = speech.speechToText(path);
            return cb(null, audio_response);
        },
        fetchGPTresponse: ['speechToText', (results, cb) => {
            if (debug) {
                return cb(null, false);
            }
            if (!results.speechToText) {
                return cb('Unable to process given audio file');
            }

            const text = results.speechToText;
            const { headers, payload } = createRequest(text);
            
            console.log('text: ', text);
            axios.post(GPT_URL, payload, {
                headers: headers
            }).then((response) => {
                console.log('response: ', response);
                if (!response.ok) {
                    return cb('Error fetching reply from GPT');
                }
                if (!response.data || !response.data.choices || !response.data.choices.length) {
                    return cb(null, 'Sorry I don\'t know this one.');
                }
                const data = response.data;
                console.log('data: ', data);
                return cb(null, data.choices);
            }).catch((err) => {
                return cb(err);
            });
        }],
        textToSpeech: ['fetchGPTresponse', (results, cb) => {
            const reply_text = ['Instagram is an social media platform owned by Meta.']
            const reply_speech = googleTTS.getAllAudioUrls(reply_text[0], {
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