const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateScripture(customPrompt = null) {
  try {
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that provides relevant scripture passages with references. Always format your response with the scripture first, followed by the reference in parentheses."
      }
    ];

    if (customPrompt) {
      messages.push({
        role: "user",
        content: `Please provide a scripture passage related to: ${customPrompt}`
      });
    } else {
      messages.push({
        role: "user",
        content: "Please provide an inspiring scripture passage with its reference."
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateScripture:', error);
    throw error;
  }
}

module.exports = { generateScripture }; 