const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async () => {
        const commandFolders = fs.readdirSync('./src/commands');
        for (const folder of commandFolders) {
            const commandFiles = fs
            .readdirSync(`./src/commands/${folder}`)
            .filter(file => file.endsWith('.js'));

            const { commands, commandsArray } = client;
            for (file in commandFiles) {
                const command = require(`../../commands/${folder}/${file}`)
                commands.set(command.data.name, command);
                commandsArray.push(command, command.data.ToJSON());
                console.log(`Commands: ${command.data.name} has passed through the handler.`);
            }
        }
    }
}