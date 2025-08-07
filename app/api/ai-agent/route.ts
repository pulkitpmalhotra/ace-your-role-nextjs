// app/api/ai-agent/route.ts - AI Agent Route
export async function POST(request: Request) {
  try {
    const { 
      scenario, 
      userMessage, 
      conversationHistory, 
      sessionState,
      sessionId 
    } = await request.json();
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ Missing GEMINI_API_KEY environment variable');
      return fallbackResponse(scenario);
    }

    if (!scenario || !userMessage || !sessionId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🧠 AI Agent processing:', {
      character: scenario.character_name,
      messageCount: conversationHistory.length,
      sessionDuration: sessionState?.duration || 0
    });

    // Build enhanced prompt
    const prompt = buildEnhancedPrompt(scenario, userMessage, conversationHistory, sessionState);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 250,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    const cleanedResponse = cleanAIResponse(aiResponse.trim());
    
    // Determine if conversation should end naturally
    const shouldEnd = shouldEndConversation(conversationHistory, sessionState);

    const enhancedResponse = {
      response: cleanedResponse,
      character: scenario.character_name,
      emotion: determineEmotionalState(conversationHistory),
      shouldEndConversation: shouldEnd,
      model: 'ai-agent',
      contextRetained: true
    };

    console.log('✅ AI agent response generated');

    return Response.json({
      success: true,
      data: enhancedResponse
    });

  } catch (error) {
    console.error('💥 AI Agent error:', error);
    return fallbackResponse(null);
  }
}

function buildEnhancedPrompt(scenario: any, userMessage: string, conversationHistory: any[], sessionState: any): string {
  const userRole = getUserRole(scenario.role);
  const duration = Math.floor((sessionState?.duration || 0) / 60);
  const exchanges = Math.floor(conversationHistory.length / 2);

  return `You are ${scenario.character_name}, a ${scenario.character_role}. You are having a conversation with a ${userRole} in this scenario: "${scenario.title}".

CHARACTER CONTEXT:
- You are ${scenario.character_name}
- Your role: ${scenario.character_role}
- Conversation duration: ${duration} minutes
- Exchanges so far: ${exchanges}

CONVERSATION HISTORY:
${conversationHistory.slice(-6).map(msg => 
  `${msg.speaker === 'user' ? userRole : scenario.character_name}: "${msg.message}"`
).join('\n')}

CURRENT SITUATION:
The ${userRole} just said: "${userMessage}"

INSTRUCTIONS:
- Stay in character as ${scenario.character_name}
- Respond naturally and professionally
- Keep responses conversational (1-2 sentences)
- Show personality appropriate to your role
- Consider the full conversation context
- Be helpful but realistic to your character

${exchanges >= 8 ? `
NATURAL CONCLUSION:
This conversation has good depth. Consider providing a natural conclusion if appropriate.
You can thank them for the discussion and suggest next steps.
` : `
CONTINUE CONVERSATION:
Build on the discussion naturally. Ask relevant questions or provide helpful responses.
`}

Respond as ${scenario.character_name}:`;
}

function shouldEndConversation(conversationHistory: any[], sessionState: any): boolean {
  const exchanges = Math.floor(conversationHistory.length / 2);
  const duration = sessionState?.duration || 0;
  
  return exchanges >= 8 || duration >= 600; // 10+ minutes or 8+ exchanges
}

function determineEmotionalState(conversationHistory: any[]): string {
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
    'strategy-lead': 'strategy lead',
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

function fallbackResponse(scenario: any) {
  return Response.json({
    success: true,
    data: {
      response: "I understand what you're saying. This has been a really valuable conversation, and I appreciate the time we've spent discussing this together.",
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      shouldEndConversation: true,
      model: 'fallback'
    }
  });
}
