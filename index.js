require('dotenv/config')
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi} = require('openai');

const configuration = new Configuration({
	apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = new Client({ 
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	]
});

// Event Listenner for command 
client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, '01-commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	const { cooldowns } = client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 3;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
///////////////////

// client.once(Events.ClientReady, () => {
// 	console.log('Ready!');
// });
// Chat GPT Code
  client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	if (message.channel.id !== process.env.CHANNEL_ID) return;
	if (!message.content.startsWith('.')) return;
  
	let conversationLog = [{ role: 'system', content: 'Professionnal chatbot' }];
  
	try {
	  await message.channel.sendTyping();
  
	  let prevMessages = await message.channel.messages.fetch({ limit: 15 });
	  prevMessages.reverse();
  
	  prevMessages.forEach((msg) => {
		if (!message.content.startsWith('.')) return;
		if (msg.author.id !== client.user.id && message.author.bot) return;
		if (msg.author.id !== message.author.id) return;
  
		conversationLog.push({
		  role: 'user',
		  content: msg.content,
		});
	  });
  
	  const result = await openai
		.createChatCompletion({
		  model: 'gpt-3.5-turbo',
		  messages: conversationLog,
		  // max_tokens: 256, // limit token usage
		})
		.catch((error) => {
		  console.log(`OPENAI ERR: ${error}`);
		});
		// if len of result.data.choices[0] is  than 1950 Caracter
		if (result.data.choices[0].message.content.length < 1950) {
			message.reply(result.data.choices[0].message);
		  }
		  else {
			console.log("ERROR ! Too many character in response.")
			message.reply("Error: The response is more than 1950 characters.");
		  }

	} catch (error) {
	  console.log(`ERR: ${error}`);
	}
  });

// Event Listenner
const eventsPath = path.join(__dirname, '02-events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.TOKEN);