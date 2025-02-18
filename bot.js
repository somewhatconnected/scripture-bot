require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { generateScripture } = require('./generateScripture');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content.toLowerCase().startsWith('!scripture')) {
    try {
      const scripture = await generateScripture();
      await message.reply(scripture);
    } catch (error) {
      console.error('Error generating scripture:', error);
      await message.reply('Sorry, I encountered an error while generating scripture.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN); 