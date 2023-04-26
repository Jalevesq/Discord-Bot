const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;
    if (!message.content.startsWith('.')) return;

    let conversationLog = [{ role: 'system', content: 'Friendly' }];

    try {
      await message.channel.sendTyping();

      let prevMessages = await message.channel.messages.fetch({ limit: 15 });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        if (!msg.content.startsWith('.')) return;
        if (msg.author.id !== message.author.id) return;

        conversationLog.push({
          role: 'user',
          content: msg.content,
        });
      });

      const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        // max_tokens: 256, // limit token usage
      });

      // if len of result.data.choices[0] is than 1950 Caracter
      if (result && result.data && result.data.choices && result.data.choices[0].message.content.length < 1950) {
        message.reply(result.data.choices[0].message.content);
      } else {
        console.log('ERROR! Too many characters in response.');
        message.reply('Error: The response is more than 1950 characters.');
      }
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  },
};