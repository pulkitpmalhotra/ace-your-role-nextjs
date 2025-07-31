// app/api/ai-chat/route.ts - Enhanced Gemini 2.5 Flash-Lite Integration
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

    console.log('🤖 Processing request:', {
      character: scenario.character_name,
      messageCount: messageCount || 0,
      conversationLength: conversationHistory?.length || 0
    });

    const emotion = determineEmotionProgression(messageCount || 0, conversationHistory);
    const gender = getCharacterGender(scenario.character_name);
    
    // Enhanced prompt with better context and personality
    const prompt = buildEnhancedPrompt(scenario, userMessage, conversationHistory, emotion, messageCount || 0);

    console.log('🤖 Calling Gemini 2.5 Flash-Lite API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8, // Slightly more creative but still professional
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 150, // Increased for more natural responses
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      
      // Parse error for better handling
      let errorMessage = 'API request failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch (e) {
        errorMessage = errorText;
      }
      
      console.error('❌ Parsed error:', errorMessage);
      return fallbackResponse(scenario);
    }

    const data = await response.json();
    console.log('📥 Raw Gemini response:', JSON.stringify(data, null, 2));

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('❌ No response content from Gemini');
      return fallbackResponse(scenario);
    }

    // Clean and validate the response
    const cleanedResponse = cleanAIResponse(aiResponse.trim());
    
    if (cleanedResponse.length < 5) {
      console.error('❌ Response too short, using fallback');
      return fallbackResponse(scenario);
    }

    console.log('✅ Gemini 2.5 Flash-Lite response generated successfully');
    console.log('🎭 Character response:', cleanedResponse);

    return Response.json({
      success: true,
      data: {
        response: cleanedResponse,
        character: scenario.character_name,
        emotion,
        gender,
        model: 'gemini-2.5-flash-lite',
        cost_savings: '43%',
        conversationTurn: (messageCount || 0) + 1
      }
    });

  } catch (error) {
    console.error('💥 AI Chat API error:', error);
    return fallbackResponse(null);
  }
}

function buildEnhancedPrompt(scenario: any, userMessage: string, conversationHistory: any[], emotion: string, messageCount: number) {
  // Build conversation context
  let contextualHistory = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4); // Last 4 messages for context
    contextualHistory = recentHistory.map((msg: any) => 
      `${msg.speaker === 'user' ? 'PROSPECT' : scenario.character_name}: ${msg.message}`
    ).join('\n');
  }

  // Determine conversation stage
  const stage = getConversationStage(messageCount, conversationHistory);
  
  // Enhanced prompt with more context
  return `You are ${scenario.character_name}, a ${scenario.character_role} in the ${scenario.category} industry.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || 'Professional and engaging'}
- Current Emotion: ${emotion}
- Industry: ${scenario.category}

CONVERSATION CONTEXT:
- Stage: ${stage}
- Turn: ${messageCount + 1}
- Scenario: ${scenario.title}
${scenario.description ? `- Situation: ${scenario.description}` : ''}

${contextualHistory ? `RECENT CONVERSATION:\n${contextualHistory}\n` : ''}

CURRENT PROSPECT MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Stay completely in character as ${scenario.character_name}
- Respond naturally based on your ${emotion} emotional state
- Keep responses conversational and realistic (20-40 words)
- Use industry-appropriate language for ${scenario.category}
- Build on the conversation naturally
- Show personality traits consistent with: ${scenario.character_personality || 'Professional demeanor'}
- React appropriately to what the prospect just said

Your authentic response as ${scenario.character_name}:`;
}

function determineEmotionProgression(messageCount: number, conversationHistory: any[] = []) {
  // Analyze conversation tone and progression
  if (messageCount === 0) return 'professional';
  
  // Look for keywords in recent messages to adjust emotion
  const recentUserMessages = conversationHistory
    .filter(msg => msg.speaker === 'user')
    .slice(-2)
    .map(msg => msg.message.toLowerCase())
    .join(' ');

  // Emotion progression based on conversation flow and content
  if (recentUserMessages.includes('price') || recentUserMessages.includes('cost') || recentUserMessages.includes('budget')) {
    return messageCount < 3 ? 'concerned' : 'professional';
  }
  
  if (recentUserMessages.includes('interested') || recentUserMessages.includes('sounds good') || recentUserMessages.includes('tell me more')) {
    return 'engaged';
  }
  
  if (recentUserMessages.includes('problem') || recentUserMessages.includes('issue') || recentUserMessages.includes('challenge')) {
    return 'curious';
  }

  // Default progression
  if (messageCount < 2) return 'professional';
  if (messageCount < 4) return 'curious';
  if (messageCount < 7) return 'interested';
  if (messageCount < 10) return 'engaged';
  return 'collaborative';
}

function getConversationStage(messageCount: number, conversationHistory: any[] = []) {
  if (messageCount === 0) return 'Opening/Greeting';
  if (messageCount < 3) return 'Rapport Building';
  if (messageCount < 6) return 'Discovery/Needs Analysis';
  if (messageCount < 9) return 'Solution Discussion';
  return 'Closing/Next Steps';
}

function cleanAIResponse(response: string): string {
  // Remove any unwanted formatting or artifacts
  let cleaned = response
    .replace(/^\*\*|\*\*$/g, '') // Remove bold markdown
    .replace(/^\*|\*$/g, '') // Remove italic markdown
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Ensure it doesn't start with character name (sometimes AI includes this)
  const namePrefixes = ['Sarah Johnson:', 'Dr. Michael Chen:', 'Jennifer Williams:', 'Robert Martinez:', 'Lisa Thompson:'];
  for (const prefix of namePrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  return cleaned;
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
    "I see where you're coming from. What would success look like for you?",
    "Interesting. Can you elaborate on that?",
    "That's a great question. Let me think about how to best address that."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  console.log('🔄 Using fallback response:', randomResponse);
  
  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'Assistant',
      emotion: 'professional',
      gender: scenario ? getCharacterGender(scenario.character_name) : 'neutral',
      model: 'fallback-intelligent',
      note: 'Fallback response due to API issue'
    }
  });
}

function getCharacterGender(characterName: string): 'male' | 'female' | 'neutral' {
  const femaleNames = [
    'sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily',
    'jessica', 'rachel', 'amanda', 'michelle', 'angela', 'melissa', 'stephanie',
    'carol', 'rebecca', 'sharon', 'cynthia', 'anna', 'brenda', 'amy', 'kathleen'
  ];
  
  const firstName = characterName.toLowerCase().split(' ')[0];
  return femaleNames.includes(firstName) ? 'female' : 'male';
}
