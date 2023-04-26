require('dotenv/config')
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, IntentsBitField} = require('discord.js');
// const { Configuration, OpenAIApi} = require('openai');


const client = new Client({ 
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages
	]
});

client.commands = new Collection();
client.commandArray = [];


// Function listenner
const functionFolders = fs.readdirSync('./src/functions');
for (const folder of functionFolders) {
	const functionFiles = fs
	.readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of functionFiles)
		require(`./functions/${folder}/${file}`)(client)
}

client.handleEvents();
// client.handleCommands();

client.login(process.env.TOKEN);