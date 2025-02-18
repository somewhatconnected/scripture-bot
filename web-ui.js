const express = require('express');
const session = require('express-session');
const app = express();
const { requireAuth, DASHBOARD_PASSWORD } = require('./middleware/auth');

// Check required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'DISCORD_TOKEN', 'DASHBOARD_PASSWORD'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const { generateScripture } = require('./generateScripture');
let discordClient = null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web UI running on port ${PORT}`);
  // Start the bot and store client reference
  const { client } = require('./bot.js');
  discordClient = client;
}); 