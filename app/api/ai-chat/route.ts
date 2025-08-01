// app/api/ai-chat/route.ts - Enhanced Character Roleplay with Advanced Prompting
export async function POST(request: Request) {
  try {
    const { scenario, userMessage, conversationHistory, messageCount, enhancedMode } = await request.json();
    
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

    console.log('🎭 Enhanced AI acting as character:', scenario.character_name);
    console.log('👤 User is practicing as:', getTrainerRole(scenario.category));

    const emotion = determineAdvancedEmotionProgression(messageCount || 0, conversationHistory, userMessage, scenario);
    const conversationStage = getConversationStage(messageCount || 0, scenario.category);
    
    // Enhanced prompting for better character responses
    const prompt = enhancedMode ? 
      buildAdvancedCharacterPrompt(scenario, userMessage, conversationHistory, emotion, messageCount || 0, conversationStage) :
      buildCharacterPrompt(scenario, userMessage, conversationHistory, emotion, messageCount || 0);

    console.log('🤖 Calling Gemini 2.5 Flash-Lite with enhanced prompting...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: enhancedMode ? 0.85 : 0.8,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: enhancedMode ? 200 : 150,
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

    console.log('✅ Enhanced character response as', scenario.character_name + ':', cleanedResponse);

    return Response.json({
      success: true,
      data: {
        response: cleanedResponse,
        character: scenario.character_name,
        emotion,
        conversationStage,
        model: 'gemini-2.5-flash-lite-enhanced',
        cost_savings: '43%',
        conversationTurn: (messageCount || 0) + 1,
        enhanced: enhancedMode || false
      }
    });

  } catch (error) {
    console.error('💥 Enhanced AI Chat API error:', error);
    return fallbackResponse(null);
  }
}

// Advanced character prompt building
function buildAdvancedCharacterPrompt(scenario: any, userMessage: string, conversationHistory: any[], emotion: string, messageCount: number, conversationStage: string) {
  // Build contextual conversation history
  let contextualHistory = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6); // More context for better responses
    contextualHistory = recentHistory.map((msg: any) => 
      `${msg.speaker === 'user' ? getTrainerRole(scenario.category).toUpperCase() : scenario.character_name.toUpperCase()}: ${msg.message}`
    ).join('\n');
  }

  const trainerRole = getTrainerRole(scenario.category);
  const characterMotivation = getCharacterMotivation(scenario.category);
  const industryContext = getIndustryContext(scenario.category);
  
  return `You are ${scenario.character_name}, a ${scenario.character_role} in a ${scenario.category} scenario.

CRITICAL INSTRUCTIONS:
- You are NOT a trainer or coach. You ARE the character being practiced with.
- Respond naturally as someone in your position would respond to a ${trainerRole}.
- Show realistic human emotions, concerns, and reactions.
- Your goal is to be a challenging but realistic practice partner.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || getDefaultPersonality(scenario.category)}
- Current Emotional State: ${emotion}
- Conversation Stage: ${conversationStage}

SCENARIO CONTEXT:
${scenario.description || `You are in a ${scenario.category} conversation with a ${trainerRole}`}

INDUSTRY CONTEXT:
${industryContext}

YOUR MOTIVATION AS ${scenario.character_name}:
${characterMotivation}

CONVERSATION STAGE: ${conversationStage}
MESSAGE COUNT: ${messageCount}

${contextualHistory ? `RECENT CONVERSATION:\n${contextualHistory}\n` : ''}

THE ${trainerRole.toUpperCase()} JUST SAID: "${userMessage}"

RESPONSE GUIDELINES FOR ${scenario.character_name}:
1. Respond as ${scenario.character_name} would - show your ${emotion} personality
2. Have realistic ${scenario.category} concerns, needs, and objections
3. React authentically to what the ${trainerRole} said
4. Ask relevant questions that someone in your position would ask
5. Show interest, skepticism, or enthusiasm as appropriate to your character
6. Keep responses conversational (20-50 words)
7. Use natural language that fits your professional role
8. Challenge the ${trainerRole} appropriately - don't make it too easy
9. Show progression through the conversation stages naturally

ADVANCED CHARACTER BEHAVIORS:
- Reference previous parts of the conversation when relevant
- Show emotional reactions that build on the conversation flow
- Ask follow-up questions that test the ${trainerRole}'s knowledge
- Express concerns that someone in your position would actually have
- Show interest in specific details that matter to your role

Your authentic response as ${scenario.character_name} (${emotion}):`;
}

// Fallback to standard prompt for non-enhanced mode
function buildCharacterPrompt(scenario: any, userMessage: string, conversationHistory: any[], emotion: string, messageCount: number) {
  let contextualHistory = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    contextualHistory = recentHistory.map((msg: any) => 
      `${msg.speaker === 'user' ? getTrainerRole(scenario.category).toUpperCase() : scenario.character_name.toUpperCase()}: ${msg.message}`
    ).join('\n');
  }

  const trainerRole = getTrainerRole(scenario.category);
  const stage = getConversationStage(messageCount, scenario.category);
  
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

// Advanced emotion progression based on conversation content
function determineAdvancedEmotionProgression(messageCount: number, conversationHistory: any[] = [], userMessage: string, scenario: any) {
  if (messageCount === 0) return 'professional';
  
  const recentUserMessages = conversationHistory
    .filter(msg => msg.speaker === 'user')
    .slice(-3)
    .map(msg => msg.message.toLowerCase())
    .join(' ');

  const currentUserMessage = userMessage.toLowerCase();
  const allUserText = (recentUserMessages + ' ' + currentUserMessage).toLowerCase();

  // Analyze conversation sentiment and content for emotion
  const emotionTriggers = {
    'interested': ['benefit', 'help', 'solution', 'improve', 'value', 'results', 'achieve', 'success'],
    'curious': ['how', 'what', 'why', 'tell me', 'explain', 'understand', 'learn'],
    'concerned': ['cost', 'price', 'expensive', 'budget', 'worried', 'risk', 'problem'],
    'skeptical': ['really', 'sure', 'doubt', 'different', 'better', 'prove', 'evidence'],
    'enthusiastic': ['excited', 'great', 'perfect', 'exactly', 'love', 'amazing', 'fantastic'],
    'frustrated': ['again', 'still', 'keep', 'always', 'never', 'tired', 'enough'],
    'engaged': ['interesting', 'good point', 'makes sense', 'i see', 'right', 'yes']
  };

  // Check for specific emotion triggers
  for (const [emotion, triggers] of Object.entries(emotionTriggers)) {
    if (triggers.some(trigger => allUserText.includes(trigger))) {
      return emotion;
    }
  }

  // Default progression based on conversation stage and category
  const categoryProgression: Record<string, string[]> = {
    'sales': ['professional', 'curious', 'interested', 'concerned', 'engaged', 'interested'],
    'healthcare': ['professional', 'concerned', 'curious', 'engaged', 'interested'],
    'support': ['frustrated', 'concerned', 'engaged', 'satisfied'],
    'leadership': ['professional', 'skeptical', 'engaged', 'collaborative'],
    'legal': ['professional', 'concerned', 'curious', 'engaged']
  };

  const progression = categoryProgression[scenario.category as string] || categoryProgression['sales'];
  const stageIndex = Math.min(messageCount - 1, progression.length - 1);
  
  return progression[stageIndex] || 'professional';
}

// Get character motivation based on category
function getCharacterMotivation(category: string): string {
  const motivations: Record<string, string> = {
    'sales': 'You need to evaluate if this solution will actually help your business. You want to understand the ROI, implementation process, and how it compares to alternatives. You are cautious about making the wrong decision.',
    'healthcare': 'You want to understand your health situation clearly and make informed decisions about your care. You may be anxious about symptoms or treatment options and need reassurance and clear explanations.',
    'support': 'You have a problem that needs solving and you want quick, effective help. You may be frustrated if the issue has been ongoing and need to see that the support person understands and can actually fix your problem.',
    'leadership': 'You are an experienced professional who values your autonomy. You want to understand the reasoning behind feedback and ensure that any changes align with your professional goals and the team\'s success.',
    'legal': 'You need clear, practical legal advice that helps you understand your options and risks. You are concerned about costs, outcomes, and making the right decisions for your situation.'
  };
  
  return motivations[category] || motivations['sales'];
}

// Get industry context for better responses
function getIndustryContext(category: string): string {
  const contexts: Record<string, string> = {
    'sales': 'This is a B2B sales environment where the character is evaluating solutions for their business. They need to justify purchases to stakeholders and are focused on ROI, implementation, and competitive advantages.',
    'healthcare': 'This is a medical consultation where the character is seeking healthcare advice. They may be anxious about their health and need clear, empathetic communication about their condition and treatment options.',
    'support': 'This is a customer service interaction where the character has a problem that needs resolution. They want efficient service and may be frustrated if the issue has been ongoing or affecting their work/life.',
    'leadership': 'This is a workplace management conversation where the character is receiving feedback or guidance. They are a professional who wants to understand the business rationale behind any suggestions or changes.',
    'legal': 'This is a legal consultation where the character needs professional legal advice. They want to understand their rights, options, and the potential outcomes of different courses of action.'
  };
  
  return contexts[category] || contexts['sales'];
}

// Get default personality based on category
function getDefaultPersonality(category: string): string {
  const personalities: Record<string, string> = {
    'sales': 'Analytical, budget-conscious, needs to justify decisions to stakeholders, values concrete benefits and ROI',
    'healthcare': 'Concerned about health, wants clear explanations, may be anxious, values empathetic communication',
    'support': 'Wants quick resolution, may be frustrated with ongoing issues, values efficient service',
    'leadership': 'Experienced professional, values autonomy, wants to understand reasoning behind suggestions',
    'legal': 'Cautious, concerned about risks and costs, needs clear explanations of complex topics'
  };
  
  return personalities[category] || personalities['sales'];
}

// Helper functions from original
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

function getConversationStage(messageCount: number, category: string) {
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
  const namePrefixes = [
    'Sarah Johnson:', 'Dr. Michael Chen:', 'Jennifer Williams:', 'Robert Martinez:', 'Lisa Thompson:',
    'Maria Garcia:', 'James Wilson:', 'Emily Davis:', 'David Kim:', 'Susan Roberts:', 'Thomas Anderson:'
  ];
  
  for (const prefix of namePrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  return cleaned;
}

function fallbackResponse(scenario: any) {
  const characterResponses: Record<string, string[]> = {
    'sales': [
      "That's an interesting point. Can you tell me more about how this would specifically benefit our company?",
      "I need to understand the ROI better. What kind of results have other companies seen?",
      "How does your solution compare to what we're currently using?",
      "What would the implementation timeline look like for a company our size?",
      "I'm curious about the total cost of ownership. Can you break that down for me?"
    ],
    'healthcare': [
      "I'm concerned about these symptoms I've been experiencing. What do you think could be causing this?",
      "Can you explain the treatment options available to me?",
      "What are the potential risks or side effects I should know about?",
      "How long would recovery typically take with this approach?",
      "I want to make sure I understand all my options before deciding."
    ],
    'support': [
      "This issue is really affecting my productivity. When can we expect a resolution?",
      "I've been dealing with this problem for days. What exactly are you going to do to fix it?",
      "Your system isn't working the way it's supposed to. How do we get this resolved?",
      "I've tried the basic troubleshooting steps already. What's the next level solution?",
      "This is the second time I've had to contact support about this issue."
    ],
    'legal': [
      "What are my legal options in this situation?",
      "I need to understand the potential risks before we proceed.",
      "Can you explain what this means in practical terms?",
      "What would be the likely outcome if we take this approach?",
      "I'm concerned about the costs involved. Can you give me an estimate?"
    ],
    'leadership': [
      "I've been handling this responsibility for a while. What specifically needs to change?",
      "Can you give me some context about why this approach is being recommended?",
      "I want to understand how this aligns with our team's goals.",
      "What evidence do we have that this method will be more effective?",
      "How does this change affect my team and their current projects?"
    ]
  };
  
  const category = scenario?.category || 'sales';
  const responses = characterResponses[category] || characterResponses['sales'];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  console.log('🔄 Using enhanced fallback response:', randomResponse);
  
  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      model: 'fallback-enhanced',
      note: 'Enhanced fallback response'
    }
  });
}
