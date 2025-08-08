// app/api/ai-conversation/route.ts - Fixed AI Conversation Flow
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

    // Build conversation prompt with clear role definition
    const prompt = buildClearConversationPrompt(scenario, userMessage, conversationHistory);

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
    
    // Only use fallback as last resort
    const { scenario } = await request.json().catch(() => ({}));
    return generateIntelligentFallback(scenario, error);
  }
}

function buildClearConversationPrompt(scenario: any, userMessage: string, conversationHistory: any[]): string {
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  // Get scenario objectives
  const objectives = getScenarioObjectives(scenario.role);
  
  const recentHistory = conversationHistory.slice(-6).map(msg => 
    `${msg.speaker === 'user' ? userRole : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  return `You are ${scenario.character_name}, a ${scenario.character_role}. You are in a professional roleplay scenario where a ${userRole} is practicing their communication skills with you.

SCENARIO CONTEXT:
- Title: "${scenario.title}"
- You are: ${scenario.character_name} (${scenario.character_role})
- They are: A ${userRole} practicing their skills
- Difficulty: ${scenario.difficulty}

SCENARIO OBJECTIVES (what the ${userRole} should accomplish):
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

CONVERSATION HISTORY:
${recentHistory}

CURRENT SITUATION:
The ${userRole} just said: "${userMessage}"

YOUR ROLE AS ${scenario.character_name.toUpperCase()}:
- You are the CLIENT/CUSTOMER/STAKEHOLDER that the ${userRole} is practicing with
- Respond as ${scenario.character_name} would in this professional situation
- Be realistic and professional, but provide appropriate challenges
- Help the ${userRole} practice by being a realistic conversation partner
- Give them opportunities to demonstrate the scenario objectives
- Keep responses conversational (1-2 sentences)
- Stay in character throughout

CONVERSATION PROGRESSION:
- Current exchanges: ${exchanges}
- ${exchanges < 4 ? 'Early conversation - be welcoming but present your needs/concerns' : 
     exchanges < 8 ? 'Mid conversation - engage with their proposals and ask clarifying questions' :
     'Later conversation - work toward resolution or next steps'}

Respond as ${scenario.character_name}:`;
}

function shouldEndConversation(conversationHistory: any[]): boolean {
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  // Natural ending after 8+ exchanges, but let conversation flow naturally
  if (exchanges >= 10) return true;
  if (exchanges >= 8) {
    // Check if conversation seems to be concluding
    const lastMessages = conversationHistory.slice(-2);
    const recentText = lastMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    const conclusionWords = ['thank you', 'thanks', 'appreciate', 'sounds good', 'perfect', 'great', 'next steps', 'follow up', 'talk soon'];
    return conclusionWords.some(word => recentText.includes(word));
  }
  
  return false;
}

function determineEmotion(conversationHistory: any[]): string {
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  if (exchanges >= 8) return 'satisfied';
  if (exchanges >= 6) return 'engaged';
  if (exchanges >= 4) return 'interested';
  if (exchanges >= 2) return 'professional';
  return 'welcoming';
}

function getUserRole(scenarioRole: string): string {
  const roleMap: Record<string, string> = {
    'sales': 'Sales Representative',
    'project-manager': 'Project Manager',
    'product-manager': 'Product Manager',
    'leader': 'Team Leader',
    'manager': 'Manager',
    'support-agent': 'Customer Support Agent',
    'data-analyst': 'Data Analyst',
    'engineer': 'Engineer',
    'nurse': 'Nurse',
    'doctor': 'Doctor'
  };
  return roleMap[scenarioRole] || 'Professional';
}

function getScenarioObjectives(role: string): string[] {
  const objectives: Record<string, string[]> = {
    'sales': [
      'Build rapport and establish trust with the prospect',
      'Identify customer needs and pain points through questioning',
      'Present solution benefits clearly and guide toward next steps'
    ],
    'project-manager': [
      'Clarify project scope, timeline, and deliverables',
      'Identify stakeholders and manage expectations',
      'Establish clear next steps and accountability'
    ],
    'product-manager': [
      'Gather comprehensive user requirements and feedback',
      'Prioritize features based on business impact',
      'Align stakeholders on product roadmap decisions'
    ],
    'leader': [
      'Communicate organizational vision and strategic direction',
      'Inspire and motivate team members toward common goals',
      'Demonstrate emotional intelligence and active listening'
    ],
    'manager': [
      'Provide specific, constructive feedback on performance',
      'Set clear expectations and measurable goals',
      'Support professional development and career growth'
    ],
    'support-agent': [
      'Quickly understand and diagnose customer issues',
      'Provide clear, step-by-step solutions and guidance',
      'Ensure complete issue resolution and customer satisfaction'
    ],
    'data-analyst': [
      'Understand business questions and analytical requirements',
      'Communicate findings clearly to non-technical stakeholders',
      'Provide actionable insights and data-driven recommendations'
    ],
    'engineer': [
      'Understand technical requirements and system constraints',
      'Communicate technical concepts to non-technical stakeholders',
      'Collaborate effectively on solution architecture decisions'
    ],
    'nurse': [
      'Provide compassionate and professional patient care',
      'Communicate clearly about procedures and care plans',
      'Coordinate effectively with medical team members'
    ],
    'doctor': [
      'Gather comprehensive patient history and symptoms',
      'Explain medical conditions and treatment options clearly',
      'Involve patients in treatment decisions and ensure informed consent'
    ]
  };
  
  return objectives[role] || objectives['sales'];
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

function generateIntelligentFallback(scenario: any, error: any) {
  console.log('🔄 Using intelligent fallback due to:', error?.message);
  
  // Generate contextual response based on scenario
  const fallbackResponses: Record<string, string[]> = {
    'sales': [
      "That's interesting. Tell me more about what you're looking for.",
      "I see. What challenges are you currently facing in this area?",
      "How would solving this problem impact your business?"
    ],
    'project-manager': [
      "Thanks for that update. What do you see as our next priority?",
      "I understand. What timeline are we working with for this?",
      "What resources do we need to make this successful?"
    ],
    'support-agent': [
      "I understand your concern. Let me help you with that.",
      "Thank you for explaining. Can you walk me through what happened?",
      "I appreciate your patience. Let's work through this together."
    ]
  };

  const responses = fallbackResponses[scenario?.role] || fallbackResponses['sales'];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'AI Assistant',
      emotion: 'professional',
      shouldEndConversation: false,
      model: 'intelligent-fallback'
    }
  });
}

function generateFallbackResponse(scenario: any) {
  return generateIntelligentFallback(scenario, new Error('API key missing'));
}
