// app/api/ai-chat/route.ts
export async function POST(request: Request) {
  try {
    const { scenario, userMessage, conversationHistory, messageCount } = await request.json();
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ Missing GEMINI_API_KEY environment variable');
      return fallbackResponse(scenario);
    }

    if (!scenario || !userMessage) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emotion = determineEmotion(messageCount || 0);
    const gender = getCharacterGender(scenario.character_name);
    
    const prompt = `You are ${scenario.character_name}, a ${gender} ${scenario.character_role}.

CONTEXT:
- Conversation Turn: ${(messageCount || 0) + 1}
- Your Emotional State: ${emotion}
- Industry: ${scenario.category}
- Your Character: ${scenario.character_personality || 'Professional and engaging'}

GUIDELINES:
- Stay completely in character as ${scenario.character_name}
- Respond naturally in 15-30 words maximum
- Show ${emotion} personality
- Use realistic ${scenario.category} industry knowledge
- Build on the conversation naturally

Previous messages:
${conversationHistory?.slice(-2).map((msg: any) => `${msg.speaker}: ${msg.message}`).join('\n') || 'None'}

User just said: "${userMessage}"

Your authentic response as ${scenario.character_name}:`;

    console.log('🤖 Calling Gemini 2.5 Flash-Lite API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topK: 50,
            topP: 0.95,
            maxOutputTokens: 100,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return fallbackResponse(scenario);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error('❌ No response content from Gemini');
      return fallbackResponse(scenario);
    }

    console.log('✅ Gemini 2.5 Flash-Lite response generated successfully');

    return Response.json({
      success: true,
      data: {
        response: aiResponse.trim(),
        character: scenario.character_name,
        emotion,
        gender,
        model: 'gemini-2.5-flash-lite',
        cost_savings: '43%'
      }
    });

  } catch (error) {
    console.error('💥 AI Chat API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function fallbackResponse(scenario: any) {
  const responses = [
    "That's interesting. Tell me more about your specific needs.",
    "I understand your perspective. What's most important to you here?",
    "Good point. How do you see this fitting into your plans?",
    "That makes sense. What timeline are you working with?",
    "I appreciate you sharing that. What questions do you have for me?",
    "Understood. What other factors should we consider?",
    "That's a valid concern. How can I help address that?",
    "I see where you're coming from. What would success look like for you?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'Assistant',
      emotion: 'professional',
      gender: 'neutral',
      model: 'fallback'
    }
  });
}

function determineEmotion(messageCount: number): string {
  if (messageCount === 0) return 'professional';
  if (messageCount < 3) return 'curious';
  if (messageCount < 6) return 'interested';
  if (messageCount < 9) return 'engaged';
  return 'collaborative';
}

function getCharacterGender(characterName: string): 'male' | 'female' | 'neutral' {
  const femaleNames = [
    'sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily',
    'jessica', 'rachel', 'amanda', 'michelle', 'angela', 'melissa', 'stephanie'
  ];
  
  const firstName = characterName.toLowerCase().split(' ')[0];
  return femaleNames.includes(firstName) ? 'female' : 'male';
}
