const express = require('express');
const app = express();
const { generateScripture } = require('./generateScripture');

app.use(express.json());
app.use(express.static('public'));

// API endpoints
app.get('/api/scripture', async (req, res) => {
  try {
    const scripture = await generateScripture();
    res.json({ scripture });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate scripture' });
  }
});

app.post('/api/scripture/custom', async (req, res) => {
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
  // Start the bot after web server is running
  require('./bot.js');
}); 