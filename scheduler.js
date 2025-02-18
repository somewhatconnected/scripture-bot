const schedule = require('node-schedule');
const { Client, GatewayIntentBits } = require('discord.js');
const { generateScripture } = require('./generateScripture');
const config = require('./config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log('Scheduler bot is ready!');
  setupScheduledMessages();
});

function setupScheduledMessages() {
  // Schedule daily scripture at 9:00 AM
  schedule.scheduleJob('0 9 * * *', async () => {
    try {
      const scripture = await generateScripture();
      for (const channelId of config.scheduledChannels) {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
          await channel.send(`Daily Scripture:\n${scripture}`);
        }
      }
    } catch (error) {
      console.error('Error sending scheduled scripture:', error);
    }
  });
}

client.login(process.env.DISCORD_TOKEN); 