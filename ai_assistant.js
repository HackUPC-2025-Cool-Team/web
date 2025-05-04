
export async function getItinerary(destination, activity, duration) {
  try {
const axios = require('axios');
const API_KEY = 'sk-debb64a8443a46679ba826ef0ba86e3f';
const endpoint = 'https://api.deepseek.com/v1/chat/completions';

const prompt = `I want a ${duration} travel itinerary for ${destination}, focused on ${activity}. Include specific places and a plan for each day.`;

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat', // use the correct model name per DeepSeek docs
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    console.log('\n🧭 Suggested Itinerary:\n');
    console.log(content || 'No content returned.');
  } catch (error) {
    console.error('❌ Error fetching itinerary:', error.response?.data || error.message);
  }
}
