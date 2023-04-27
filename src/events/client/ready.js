const { Events, ActivityType} = require('discord.js');
require('dotenv/config')

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setActivity('the real world', {type: ActivityType.Competing});
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};