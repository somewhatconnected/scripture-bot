const express = require('express');
const app = express();
const { generateScripture } = require('./generateScripture');

app.use(express.json());
app.use(express.static('public'));

app.get('/api/scripture', async (req, res) => {
  try {
    const scripture = await generateScripture();
    res.json({ scripture });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate scripture' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 