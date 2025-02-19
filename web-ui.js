const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
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

// Session middleware setup
const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
});

// Initialize Redis before starting the server
(async () => {
  const redisInitialized = await initializeRedis();
  if (!redisInitialized) {
    console.warn('Using MemoryStore as fallback (not recommended for production)');
  }

  // Rest of your existing code...
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sessionMiddleware);

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

  // Protected API endpoints
  app.get('/api/status', requireAuth, (req, res) => {
    const status = {
      online: discordClient?.isReady() ?? false,
      channels: Array.from(discordClient?.channels.cache.values() ?? [])
        .filter(channel => channel.type === 0) // Text channels only
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          guild: channel.guild.name
        })),
      scheduledTasks: getScheduledTasks()
    };
    res.json(status);
  });

  app.post('/api/schedule', requireAuth, async (req, res) => {
    try {
      const { channelId, time, frequency } = req.body;
      updateSchedule(channelId, time, frequency);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
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

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Web UI running on port ${PORT}`);
    const { client } = require('./bot.js');
    discordClient = client;
  });
})(); 