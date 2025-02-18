module.exports = {
  // Array of Discord channel IDs where scheduled messages should be sent
  scheduledChannels: [
    '1341533174970450003'
  ],
  
  // Web UI configuration
  webUI: {
    enabled: true,
    port: process.env.PORT || 3000
  },
  
  // Bot configuration
  bot: {
    prefix: '!scripture',
    // Add more bot configuration options here
  }
}; 