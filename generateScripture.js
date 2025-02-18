const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateScripture() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides relevant scripture passages with references."
        },
        {
          role: "user",
          content: "Please provide an inspiring scripture passage with its reference."
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateScripture:', error);
    throw error;
  }
}

module.exports = { generateScripture }; 