require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { generateScripture } = require('./generateScripture');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Error handling for the client
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  try {
    if (message.content.toLowerCase() === '!scripture') {
      const scripture = await generateScripture();
      await sendScriptureEmbed(message, scripture);
    } 
    else if (message.content.toLowerCase().startsWith('!scripture ')) {
      const prompt = message.content.slice('!scripture '.length);
      const scripture = await generateScripture(prompt);
      await sendScriptureEmbed(message, scripture, prompt);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Sorry, I encountered an error while generating scripture. Please try again later.')
      ]
    });
  }
});

async function sendScriptureEmbed(message, scripture, prompt = null) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(prompt ? `Scripture about: ${prompt}` : 'Daily Scripture')
    .setDescription(scripture)
    .setTimestamp()
    .setFooter({ text: 'Scripture Bot' });

  await message.reply({ embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN); 