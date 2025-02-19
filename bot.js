require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { generateScripture } = require('./generateScripture');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// Error handling for the client
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Verify channel access
  try {
    const channel = await client.channels.fetch(config.bot.defaultChannel);
    if (channel) {
      console.log(`Successfully connected to channel: ${channel.name}`);
    }
  } catch (error) {
    console.error('Error accessing channel:', error);
  }

  client.user.setPresence({
    status: 'online',
    activities: [{
      name: config.bot.prefix,
      type: 'WATCHING'
    }]
  });
});

// Add reconnection handling
client.on('disconnect', () => {
  console.log('Bot disconnected!');
  client.login(process.env.DISCORD_TOKEN);
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

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login to Discord:', error);
}); 