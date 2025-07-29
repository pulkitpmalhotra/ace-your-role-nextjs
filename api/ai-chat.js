// api/ai-chat.js - Enhanced with emotional and character-specific responses
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

    // Generate AI response with enhanced character behavior
    const aiResponse = await generateEnhancedGeminiResponse(
      scenario,
      userMessage,
      conversationHistory || []
    );

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        character: scenario.character_name,
        emotion: getCharacterEmotion(scenario, userMessage, conversationHistory),
        gender: detectCharacterGender(scenario.character_name)
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
        character: 'Customer',
        emotion: 'neutral',
        gender: 'neutral'
      }
    });
  }
}

function detectCharacterGender(characterName) {
  const femaleNames = [
    'sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily', 
    'jessica', 'rachel', 'amanda', 'michelle', 'angela', 'melissa', 'deborah',
    'stephanie', 'carol', 'rebecca', 'sharon', 'cynthia', 'anna', 'brenda',
    'amy', 'kathleen', 'virginia', 'pamela', 'maria', 'heather', 'diane',
    'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan', 'evelyn',
    'judith', 'margaret', 'cheryl', 'andrea', 'hannah', 'megan', 'nicole',
    'olivia', 'sophia', 'emma', 'isabella', 'ava', 'mia', 'abigail'
  ];

  const maleNames = [
    'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 
    'charles', 'joseph', 'thomas', 'christopher', 'daniel', 'paul', 'mark',
    'donald', 'steven', 'andrew', 'kenneth', 'paul', 'joshua', 'kevin',
    'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey',
    'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen',
    'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'frank',
    'gregory', 'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry'
  ];

  const firstName = characterName.toLowerCase().split(' ')[0];
  
  if (femaleNames.includes(firstName)) return 'female';
  if (maleNames.includes(firstName)) return 'male';
  
  // Fallback to neutral if name not recognized
  return 'neutral';
}

function getCharacterEmotion(scenario, userMessage, conversationHistory) {
  const messageCount = conversationHistory.length;
  const userMessageLower = userMessage.toLowerCase();
  
  // Determine emotion based on conversation flow and content
  if (messageCount === 0) return 'curious';
  
  if (userMessageLower.includes('price') || userMessageLower.includes('cost') || userMessageLower.includes('expensive')) {
    return 'concerned';
  }
  
  if (userMessageLower.includes('benefit') || userMessageLower.includes('help') || userMessageLower.includes('solve')) {
    return 'interested';
  }
  
  if (userMessageLower.includes('no') || userMessageLower.includes('not interested') || userMessageLower.includes('busy')) {
    return 'skeptical';
  }
  
  if (messageCount > 6) return 'engaged';
  if (messageCount > 3) return 'warming_up';
  
  return 'professional';
}

async function generateEnhancedGeminiResponse(scenario, userMessage, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const characterGender = detectCharacterGender(scenario.character_name);
  const emotion = getCharacterEmotion(scenario, userMessage, conversationHistory);
  const messageCount = conversationHistory.length;

  // Build conversation context
  const historyText = conversationHistory
    .slice(-8) // Last 8 messages for better context
    .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name}: ${msg.message}`)
    .join('\n');

  // Create enhanced character prompt
  const prompt = generateCharacterPrompt(scenario, characterGender, emotion, messageCount, historyText, userMessage);

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
  temperature: 0.9,
  topK: 50,
  topP: 0.95,
  maxOutputTokens: 150,
  thinkingBudget: 'low' // New parameter for cost optimization
}
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

function generateCharacterPrompt(scenario, gender, emotion, messageCount, historyText, userMessage) {
  const emotionInstructions = {
    curious: "Show genuine curiosity and ask thoughtful questions. Use phrases like 'That's interesting...' or 'Tell me more about...'",
    interested: "Express growing interest with enthusiasm. Use words like 'That sounds promising' or 'I can see how that would help'",
    concerned: "Show hesitation and ask for clarification. Use phrases like 'I'm wondering about...' or 'Help me understand...'",
    skeptical: "Be politely doubtful but open to being convinced. Use phrases like 'I'm not sure about...' or 'In my experience...'",
    professional: "Maintain a business-like tone while being approachable. Ask practical questions about implementation",
    warming_up: "Show signs of building rapport. Use more personal language and share relevant experiences",
    engaged: "Be actively interested and ask detailed follow-up questions. Show you're seriously considering the proposal"
  };

  const genderPersonality = {
    female: "Use a slightly warmer communication style with more collaborative language. Express empathy when appropriate.",
    male: "Use a direct, results-focused communication style. Focus on practical outcomes and ROI.",
    neutral: "Balance warmth with professionalism. Focus on clear, practical communication."
  };

  const roleBasedBehavior = getRoleBasedBehavior(scenario.character_role);
  
  return `You are ${scenario.character_name}, a ${gender} ${scenario.character_role}.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Gender: ${gender}
- Personality: ${scenario.character_personality}
- Current Emotion: ${emotion}
- Scenario: ${scenario.description}

COMMUNICATION STYLE:
${genderPersonality[gender]}
${emotionInstructions[emotion]}
${roleBasedBehavior}

CONVERSATION CONTEXT:
This is message #${messageCount + 1} in our conversation.
${historyText ? `Previous conversation:\n${historyText}\n` : ''}

CURRENT SITUATION:
The salesperson just said: "${userMessage}"

RESPONSE GUIDELINES:
- Stay completely in character as ${scenario.character_name}
- Keep responses 15-30 words (natural speaking length)
- Match the ${emotion} emotion in your tone
- Use natural business conversation patterns
- Ask relevant follow-up questions based on your role
- Vary your language - avoid repetitive phrases
- Show personality through word choice and emphasis
- React authentically to what the salesperson just said
- If discussing price/budget, respond as a ${scenario.character_role} would
- Include natural hesitations, enthusiasm, or concerns as appropriate

FORBIDDEN:
- Never break character or mention you're an AI
- Don't use overly formal or robotic language
- Avoid repeating the same phrases from earlier messages
- Don't be too eager or too resistant - be realistic

Your authentic response as ${scenario.character_name} (${emotion}, ${gender}):`;
}

function getRoleBasedBehavior(role) {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('ceo') || roleLower.includes('executive')) {
    return "Focus on strategic impact and ROI. You make decisions quickly but want to see clear business value. Time is precious.";
  }
  
  if (roleLower.includes('manager') || roleLower.includes('director')) {
    return "You're practical and results-oriented. You need to justify decisions to your team/boss. Ask about implementation and team impact.";
  }
  
  if (roleLower.includes('owner') || roleLower.includes('founder')) {
    return "Every decision affects your business personally. You're cost-conscious but willing to invest in proven solutions.";
  }
  
  if (roleLower.includes('buyer') || roleLower.includes('purchas')) {
    return "You're detail-oriented and comparison-focused. You need specifications, warranties, and vendor reliability information.";
  }
  
  if (roleLower.includes('it') || roleLower.includes('tech')) {
    return "Focus on technical specifications, integration, and security. You're analytical and want detailed technical information.";
  }
  
  if (roleLower.includes('marketing')) {
    return "Think about brand impact and customer engagement. You're creative but also data-driven about results.";
  }
  
  return "You're a professional who needs to understand how this solution will specifically help your role and organization.";
}
