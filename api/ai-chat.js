import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { scenarioId, userMessage, conversationHistory } = req.body;

    if (!scenarioId || !userMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing scenarioId or userMessage'
      });
    }

    // Get scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      return res.status(404).json({
        success: false,
        error: 'Scenario not found'
      });
    }

    // Generate AI response
    const aiResponse = await generateGeminiResponse(
      scenario,
      userMessage,
      conversationHistory || []
    );

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        character: scenario.character_name
      }
    });

  } catch (error) {
    console.error('AI Chat API error:', error);
    
    // Fallback response
    const fallbackResponses = [
      "I'm interested to hear more about what you're offering.",
      "That sounds intriguing. Can you tell me more details?",
      "I'd like to understand how this could help my business.",
      "What makes your solution different from others?"
    ];
    
    res.status(200).json({
      success: true,
      data: {
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        character: 'Customer'
      }
    });
  }
}

async function generateGeminiResponse(scenario, userMessage, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build conversation context
  const historyText = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name}: ${msg.message}`)
    .join('\n');

  // Create prompt
  const prompt = `You are ${scenario.character_name}, a ${scenario.character_role}.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality}
- Scenario: ${scenario.description}

CONVERSATION HISTORY:
${historyText}

CURRENT SITUATION:
The salesperson just said: "${userMessage}"

INSTRUCTIONS:
- Respond ONLY as ${scenario.character_name}
- Stay completely in character
- Keep responses under 25 words
- Sound natural and conversational
- Show appropriate business interest or skepticism
- Ask relevant follow-up questions when appropriate
- Never break character or mention you're an AI

Your response as ${scenario.character_name}:`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 100,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text.trim();
}
