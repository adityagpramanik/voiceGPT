require('dotenv').config()
const { Leopard } = require("@picovoice/leopard-node");
const fs = require("fs");
const STT_API = process.env.PICOVOICE_STT_API;


module.exports = {
	speechToText: (path)=> {
		const leopard = new Leopard(STT_API);
		const { transcript, words } = leopard.processFile(path);
		fs.unlink(path, (err) => {
			if (err) {
				console.log('error: ', err);
			}
		})
		return {transcript: transcript, words: words};
	},
}