const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const { Client } = require('discord.js');
const config = require('./config');
const app = express();
const { requireAuth, DASHBOARD_PASSWORD } = require('./middleware/auth');
const path = require('path');

// Initialize Redis client with better error handling
let redisStore;
const initializeRedis = async () => {
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Connected to Redis'));

    await redisClient.connect();
    
    redisStore = new RedisStore({
      client: redisClient,
      prefix: "scripture-bot:"
    });
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return false;
  }
};

// Wait for Redis to be ready before setting up sessions
const setupApp = async () => {
  try {
    await initializeRedis();
    
    // Session middleware configuration
    app.use(session({
      store: redisStore,  // Use Redis store instead of MemoryStore
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      }
    }));

    // Rest of your existing code...
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files only after authentication
    app.use('/dashboard', requireAuth, express.static('public'));

    // Login routes
    app.get('/login', (req, res) => {
      res.sendFile(__dirname + '/public/login.html');
    });

    app.post('/login', (req, res) => {
      if (req.body.password === DASHBOARD_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect('/dashboard');
      } else {
        res.redirect('/login?error=1');
      }
    });

    app.get('/logout', (req, res) => {
      req.session.destroy();
      res.redirect('/login');
    });

    // Add status tracking
    let botStatus = 'offline';
    let connectedChannels = [];

    // Function to update bot status
    const updateBotStatus = (status) => {
      botStatus = status;
    };

    // Function to get connected channels
    const getConnectedChannels = async (client) => {
      try {
        const channel = await client.channels.fetch(config.bot.defaultChannel);
        if (channel) {
          connectedChannels = [{
            id: channel.id,
            name: channel.name,
            guild: channel.guild.name
          }];
          console.log('Successfully loaded channel:', channel.name);
          return connectedChannels;
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
        connectedChannels = [];
      }
      return connectedChannels;
    };

    // API endpoints
    app.get('/api/status', (req, res) => {
      res.json({
        status: botStatus,
        channels: connectedChannels
      });
    });

    app.get('/api/channels', async (req, res) => {
      try {
        res.json({ channels: connectedChannels });
      } catch (error) {
        console.error('Error getting channels:', error);
        res.status(500).json({ error: 'Failed to get channels' });
      }
    });

    // Original API endpoints with auth
    app.get('/api/scripture', requireAuth, async (req, res) => {
      try {
        const scripture = await generateScripture();
        res.json({ scripture });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate scripture' });
      }
    });

    app.post('/api/scripture/custom', requireAuth, async (req, res) => {
      try {
        const { prompt } = req.body;
        const scripture = await generateScripture(prompt);
        res.json({ scripture });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate custom scripture' });
      }
    });

    // Serve static files from the public directory
    app.use(express.static('public'));

    // Root route handler
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Web UI running on port ${port}`);
      const { client } = require('./bot.js');
      discordClient = client;
    });
  } catch (error) {
    console.error('Failed to setup application:', error);
    process.exit(1);
  }
};

setupApp(); 