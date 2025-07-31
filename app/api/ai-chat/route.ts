// app/api/ai-chat/route.ts - Fixed Character Roleplay
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

    console.log('🎭 AI acting as character:', scenario.character_name);
    console.log('👤 User is practicing as:', getTrainerRole(scenario.category));

    const emotion = determineEmotionProgression(messageCount || 0, conversationHistory);
    const gender = getCharacterGender(scenario.character_name);
    
    // Fixed prompt - AI is the CHARACTER, user is the trainer
    const prompt = buildCharacterPrompt(scenario, userMessage, conversationHistory, emotion, messageCount || 0);

    console.log('🤖 Calling Gemini 2.5 Flash-Lite API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 150,
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
      return fallbackResponse(scenario);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('❌ No response content from Gemini');
      return fallbackResponse(scenario);
    }

    const cleanedResponse = cleanAIResponse(aiResponse.trim());
    
    if (cleanedResponse.length < 5) {
      console.error('❌ Response too short, using fallback');
      return fallbackResponse(scenario);
    }

    console.log('✅ Character response as', scenario.character_name + ':', cleanedResponse);

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

function buildCharacterPrompt(scenario: any, userMessage: string, conversationHistory: any[], emotion: string, messageCount: number) {
  // Build conversation context
  let contextualHistory = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    contextualHistory = recentHistory.map((msg: any) => 
      `${msg.speaker === 'user' ? getTrainerRole(scenario.category).toUpperCase() : scenario.character_name.toUpperCase()}: ${msg.message}`
    ).join('\n');
  }

  // Get the user's training role
  const trainerRole = getTrainerRole(scenario.category);
  const stage = getConversationStage(messageCount, conversationHistory, scenario.category);
  
  // CRITICAL: AI plays the CHARACTER, user plays the trainer
  return `You are ${scenario.character_name}, a ${scenario.character_role} in a ${scenario.category} scenario.

IMPORTANT: You are NOT a trainer or coach. You ARE the character that someone is practicing with.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || 'Professional but has real needs and concerns'}
- Current Mood: ${emotion}
- Industry: ${scenario.category}

SITUATION:
${scenario.description || `You are in a ${scenario.category} conversation`}

THE PERSON TALKING TO YOU:
- They are a ${trainerRole} (practicing their skills)
- They are trying to ${getTrainerObjective(scenario.category)}
- Respond as the CHARACTER would respond to a ${trainerRole}

CONVERSATION STAGE: ${stage}

${contextualHistory ? `RECENT CONVERSATION:\n${contextualHistory}\n` : ''}

THE ${trainerRole.toUpperCase()} JUST SAID: "${userMessage}"

INSTRUCTIONS FOR YOU AS ${scenario.character_name}:
- BE the ${scenario.character_role}, don't act like a trainer
- Respond naturally as someone in your position would
- Show ${emotion} personality based on the conversation flow
- Have realistic ${scenario.category} concerns and needs
- React authentically to what the ${trainerRole} said
- Keep responses conversational (15-35 words)
- Don't give training advice - you're the one being practiced on

Your authentic response as ${scenario.character_name}:`;
}

function getTrainerRole(category: string): string {
  const roleMap: Record<string, string> = {
    'sales': 'salesperson',
    'healthcare': 'healthcare provider', 
    'support': 'customer service representative',
    'legal': 'lawyer',
    'leadership': 'manager'
  };
  return roleMap[category] || 'professional';
}

function getTrainerObjective(category: string): string {
  const objectiveMap: Record<string, string> = {
    'sales': 'sell you a solution and understand your needs',
    'healthcare': 'provide you with medical care and advice',
    'support': 'help resolve your customer service issue',
    'legal': 'provide you with legal counsel and advice',
    'leadership': 'lead and manage effectively'
  };
  return objectiveMap[category] || 'help you professionally';
}

function determineEmotionProgression(messageCount: number, conversationHistory: any[] = []) {
  // Analyze conversation tone for character emotion
  if (messageCount === 0) return 'professional';
  
  const recentUserMessages = conversationHistory
    .filter(msg => msg.speaker === 'user')
    .slice(-2)
    .map(msg => msg.message.toLowerCase())
    .join(' ');

  // Character emotional responses based on what trainer is doing
  if (recentUserMessages.includes('price') || recentUserMessages.includes('cost') || recentUserMessages.includes('budget')) {
    return messageCount < 3 ? 'concerned' : 'cautious';
  }
  
  if (recentUserMessages.includes('benefit') || recentUserMessages.includes('help') || recentUserMessages.includes('solution')) {
    return 'interested';
  }
  
  if (recentUserMessages.includes('problem') || recentUserMessages.includes('challenge') || recentUserMessages.includes('issue')) {
    return 'engaged';
  }

  // Natural character progression
  if (messageCount < 2) return 'professional';
  if (messageCount < 4) return 'curious';
  if (messageCount < 7) return 'interested';
  if (messageCount < 10) return 'engaged';
  return 'collaborative';
}

function getConversationStage(messageCount: number, conversationHistory: any[] = [], category: string) {
  if (messageCount === 0) return 'Initial Contact';
  if (messageCount < 3) return 'Rapport Building';
  if (messageCount < 6) return getMiddleStage(category);
  if (messageCount < 9) return 'Solution Discussion';
  return 'Decision Making';
}

function getMiddleStage(category: string): string {
  const stageMap: Record<string, string> = {
    'sales': 'Needs Discovery',
    'healthcare': 'Symptom Assessment',
    'support': 'Issue Diagnosis', 
    'legal': 'Case Analysis',
    'leadership': 'Problem Identification'
  };
  return stageMap[category] || 'Information Gathering';
}

function cleanAIResponse(response: string): string {
  let cleaned = response
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^\*|\*$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove character name if AI included it
  const namePrefixes = ['Sarah Johnson:', 'Dr. Michael Chen:', 'Jennifer Williams:', 'Robert Martinez:', 'Lisa Thompson:'];
  for (const prefix of namePrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  return cleaned;
}

function fallbackResponse(scenario: any) {
  // Character-appropriate fallback responses
  const characterResponses: Record<string, string[]> = {
    'sales': [
      "I'm always looking for solutions that can help our business grow.",
      "What makes your approach different from what we're currently using?",
      "I need to understand how this fits our budget and timeline.",
      "Can you tell me more about the implementation process?",
      "What kind of ROI should we expect to see?"
    ],
    'healthcare': [
      "I'm concerned about these symptoms I've been experiencing.",
      "What do you think could be causing this issue?",
      "I want to make sure we explore all the options available.",
      "How long do you think the treatment will take?",
      "Are there any side effects I should be aware of?"
    ],
    'support': [
      "I'm having trouble with my account and need this resolved quickly.",
      "This isn't working the way it's supposed to work.",
      "I've been a customer for years and expect better service.",
      "Can you help me understand what went wrong here?",
      "What are you going to do to fix this problem?"
    ],
    'legal': [
      "I need to understand my legal options in this situation.",
      "What are the potential risks if we proceed this way?",
      "How long do these types of cases typically take?",
      "I'm concerned about the costs involved in this process.",
      "What documents do you need from me to move forward?"
    ],
    'leadership': [
      "I've been doing this job for a while and know what works.",
      "I'm not sure I agree with this new direction we're taking.",
      "My team has been resistant to changes like this before.",
      "What evidence do you have that this approach will work?",
      "I need to see how this benefits my department specifically."
    ]
  };
  
  const category = scenario?.category || 'sales';
  const responses = characterResponses[category] || characterResponses['sales'];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  console.log('🔄 Using character fallback response:', randomResponse);
  
  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      gender: scenario ? getCharacterGender(scenario.character_name) : 'neutral',
      model: 'fallback-character',
      note: 'Character fallback response'
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
