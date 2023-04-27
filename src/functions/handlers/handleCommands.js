const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9')

module.exports = (client) => {
    client.handleCommands = async () => {
        const commandFolders = fs.readdirSync('./src/commands');
        for (const folder of commandFolders) {
            const commandFiles = fs
            .readdirSync(`./src/commands/${folder}`)
            .filter(file => file.endsWith('.js'));

            const { commands, commandsArray } = client;
            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`);
                commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
                console.log(`Commands: ${command.data.name} has passed through the handler.`);
            }
        }
        const clientId = '1099142689829691463';
        const guildId = '688041269276311641';
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
        try {
            console.log(`Started refreshing application (/) commands.`);
            // applicationCommands for a multi server bot (only need clientId)
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: client.commandsArray }
            );
            console.log("Successfully reloaded application (/) commands.");
        } catch (error) {
            console.log(error);
        }
    }
}