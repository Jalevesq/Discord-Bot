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
        if (message.author.bot) return;
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
      const MAX_MESSAGE_LENGTH = 1950;
      if (result && result.data && result.data.choices) {
        const content = result.data.choices[0].message.content;
      
        if (content.length > MAX_MESSAGE_LENGTH && content.length < 4500) {
            const content = result.data.choices[0].message.content;
            const messages = [];
            let start = 0;
            while (start < content.length) {
              let end = start + MAX_MESSAGE_LENGTH;
              if (end < content.length) {
                // Find the nearest whitespace character before maxLength
                end = content.lastIndexOf(' ', end);
              }
              const messageContent = content.substring(start, end);
              messages.push(messageContent);
              start = end + 1;
            }
    
            for (const messageContent of messages) {
              message.reply(messageContent);
            }
        } else if (content.length < MAX_MESSAGE_LENGTH) {
          await message.reply(content);
        }
        else
        {
            await message.reply("Response has too much character (more than 4500).")
        }
      }
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  },
};