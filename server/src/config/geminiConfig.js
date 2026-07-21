require('dotenv').config();

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  
  getApiUrl() {
    const key = this.apiKey || process.env.GEMINI_API_KEY || '';
    const model = this.model || 'gemini-1.5-flash';
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  },

  isConfigured() {
    return !!(this.apiKey || process.env.GEMINI_API_KEY);
  },

  async generateContent(promptText) {
    if (!this.isConfigured()) {
      console.log('⚠️ GEMINI_API_KEY is not set in environment variables. Gemini API disabled.');
      return null;
    }

    try {
      const url = this.getApiUrl();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('❌ Gemini API Response Error:', response.status, errText);
        return null;
      }

      const data = await response.json();
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return resultText ? resultText.trim() : null;
    } catch (error) {
      console.error('❌ Failed to call Gemini API:', error.message);
      return null;
    }
  }
};

module.exports = geminiConfig;
