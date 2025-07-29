// /api/ai-chat.js
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Enhanced generation config
const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topK: 50,
      topP: 0.95,
      maxOutputTokens: 150,
      // New Gemini 2.5 features
      thinkingBudget: 'low', // Cost optimization
      responseSchema: {
        type: "object",
        properties: {
          response: { type: "string" },
          emotion: { type: "string" },
          confidence: { type: "number" }
        }
      }
    }
  })
});
