// app/api/ai-conversation/route.ts - Single AI endpoint using Gemini
export async function POST(request: Request) {
  try {
    const { scenario, userMessage, conversationHistory, sessionId } = await request.json();
    
    // Validate required fields
    if (!scenario || !userMessage || !sessionId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.error('❌ Missing GOOGLE_AI_API_KEY');
      return generateFallbackResponse(scenario);
    }

    console.log('🤖 Generating AI response with Gemini...');

    // Build conversation prompt
    const prompt = buildConversationPrompt(scenario, userMessage, conversationHistory);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 300,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    // Process response
    const cleanResponse = cleanAIResponse(aiResponse);
    const shouldEnd = shouldEndConversation(conversationHistory);
    const emotion = determineEmotion(conversationHistory);

    console.log('✅ Gemini response generated successfully');

    return Response.json({
      success: true,
      data: {
        response: cleanResponse,
        character: scenario.character_name,
        emotion: emotion,
        shouldEndConversation: shouldEnd,
        model: 'gemini-2.0-flash'
      }
    });

  } catch (error) {
    console.error('❌ AI Conversation error:', error);
    
    // Fallback response
    const { scenario } = await request.json().catch(() => ({}));
    return generateFallbackResponse(scenario);
  }
}

function buildConversationPrompt(scenario: any, userMessage: string, conversationHistory: any[]): string {
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  const recentHistory = conversationHistory.slice(-6).map(msg => 
    `${msg.speaker === 'user' ? userRole : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  return `You are ${scenario.character_name}, a ${scenario.character_role}. You are having a professional conversation with a ${userRole} about "${scenario.title}".

CHARACTER CONTEXT:
- You are ${scenario.character_name}
- Your role: ${scenario.character_role}
- Conversation topic: ${scenario.title}
- Exchanges so far: ${exchanges}

RECENT CONVERSATION:
${recentHistory}

CURRENT MESSAGE:
The ${userRole} just said: "${userMessage}"

INSTRUCTIONS:
- Stay in character as ${scenario.character_name}
- Respond naturally and professionally
- Keep responses conversational (1-2 sentences)
- Show appropriate personality for your role
- Consider the conversation context

${exchanges >= 8 ? 'NATURAL CONCLUSION: This conversation has good depth. Consider providing a natural conclusion if appropriate.' : 'CONTINUE CONVERSATION: Build on the discussion naturally.'}

Respond as ${scenario.character_name}:`;
}

function shouldEndConversation(conversationHistory: any[]): boolean {
  const exchanges = Math.floor(conversationHistory.length / 2);
  return exchanges >= 8; // Natural ending after 8+ exchanges
}

function determineEmotion(conversationHistory: any[]): string {
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  if (exchanges >= 8) return 'satisfied';
  if (exchanges >= 6) return 'engaged';
  if (exchanges >= 4) return 'interested';
  return 'professional';
}

function getUserRole(scenarioRole: string): string {
  const roleMap: Record<string, string> = {
    'sales': 'salesperson',
    'project-manager': 'project manager',
    'product-manager': 'product manager',
    'leader': 'leader',
    'manager': 'manager',
    'support-agent': 'customer service representative',
    'data-analyst': 'data analyst',
    'engineer': 'engineer',
    'nurse': 'healthcare provider',
    'doctor': 'healthcare provider'
  };
  return roleMap[scenarioRole] || 'professional';
}

function cleanAIResponse(response: string): string {
  return response
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^\*|\*$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFallbackResponse(scenario: any) {
  const responses = [
    "That's really interesting. Could you tell me more about that?",
    "I understand what you're saying. How does that make you feel about the situation?",
    "That's a great point. Let me share my perspective on this.",
    "I appreciate you sharing that with me. What would you like to discuss next?",
    "Thank you for this conversation. I feel we've covered some important points today."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'AI Assistant',
      emotion: 'professional',
      shouldEndConversation: false,
      model: 'fallback'
    }
  });
}
