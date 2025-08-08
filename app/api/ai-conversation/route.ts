// app/api/ai-conversation/route.ts - Fixed with Vercel AI SDK
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

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
      return generateContextualFallback(scenario, userMessage, conversationHistory);
    }

    console.log('🤖 Generating enhanced AI response with Gemini 2.5 Flash Lite...');

    // Build enhanced conversation prompt
    const prompt = buildEnhancedConversationPrompt(scenario, userMessage, conversationHistory);

    try {
      // Use Vercel AI SDK with Gemini 2.5 Flash Lite
      // API key should be set in environment as GOOGLE_GENERATIVE_AI_API_KEY
      const { text: aiResponse } = await generateText({
        model: google('gemini-2.5-flash-lite'),
        prompt: prompt,
        temperature: 0.9, // Higher for more natural responses
        maxTokens: 200, // Shorter for conversation flow
        topP: 0.95,
        topK: 40,
        frequencyPenalty: 0.3, // Reduce repetition
        presencePenalty: 0.2, // Encourage diverse responses
      });

      if (!aiResponse || aiResponse.trim().length === 0) {
        console.error('❌ Empty response from Gemini');
        return generateContextualFallback(scenario, userMessage, conversationHistory);
      }

      // Process and validate response
      const cleanResponse = cleanAIResponse(aiResponse);
      
      // Ensure response is conversational and not too long
      if (cleanResponse.length > 300) {
        console.log('⚠️ Response too long, using fallback');
        return generateContextualFallback(scenario, userMessage, conversationHistory);
      }
      
      // Check if response sounds too AI-like
      if (isAILikeResponse(cleanResponse)) {
        console.log('⚠️ Response sounds too AI-like, using fallback');
        return generateContextualFallback(scenario, userMessage, conversationHistory);
      }
      
      const shouldEnd = shouldEndConversation(conversationHistory);
      const emotion = determineEmotion(conversationHistory, scenario);

      console.log('✅ Enhanced Gemini 2.5 Flash Lite response generated successfully');

      return Response.json({
        success: true,
        data: {
          response: cleanResponse,
          character: scenario.character_name,
          emotion: emotion,
          shouldEndConversation: shouldEnd,
          model: 'gemini-2.5-flash-lite'
        }
      });

    } catch (aiError) {
      console.error('❌ Vercel AI SDK error:', aiError);
      return generateContextualFallback(scenario, userMessage, conversationHistory);
    }

  } catch (error) {
    console.error('❌ AI Conversation error:', error);
    
    // Use contextual fallback for any errors
    const { scenario, userMessage, conversationHistory } = await request.json().catch(() => ({}));
    return generateContextualFallback(scenario, userMessage, conversationHistory);
  }
}

function buildEnhancedConversationPrompt(scenario: any, userMessage: string, conversationHistory: any[]): string {
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  // Get scenario objectives
  const objectives = getScenarioObjectives(scenario.role);
  
  const recentHistory = conversationHistory.slice(-6).map(msg => 
    `${msg.speaker === 'user' ? userRole : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  // Determine conversation stage
  const stage = exchanges < 3 ? 'opening' : exchanges < 6 ? 'middle' : 'closing';
  
  return `You are ${scenario.character_name}, a ${scenario.character_role}. You are having a realistic professional conversation with a ${userRole} who is practicing their communication skills.

CRITICAL INSTRUCTIONS:
- You are NOT an AI assistant or helper
- You are a REAL ${scenario.character_role} with genuine needs and concerns
- Respond as ${scenario.character_name} would in this real situation
- Have natural reactions, ask follow-up questions, show genuine interest or concern
- Challenge them appropriately but professionally
- Give them opportunities to practice the scenario objectives
- Keep responses short and conversational (1-2 sentences max)
- Be authentic and realistic
- NEVER say things like "How can I help you" or "I'm here to assist"

SCENARIO: "${scenario.title}"
Your role: ${scenario.character_name} (${scenario.character_role})
Their role: ${userRole}
Difficulty: ${scenario.difficulty}
Conversation stage: ${stage}

WHAT THE ${userRole.toUpperCase()} SHOULD PRACTICE:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

CONVERSATION SO FAR:
${recentHistory}

THE ${userRole.toUpperCase()} JUST SAID: "${userMessage}"

RESPONSE GUIDELINES FOR ${stage.toUpperCase()} STAGE:
${getStageGuidelines(stage, scenario.role, userRole)}

NOW RESPOND AS ${scenario.character_name}:
- Be authentic and realistic as a ${scenario.character_role}
- React naturally to what they said
- Ask relevant follow-up questions when appropriate
- Present realistic challenges or needs
- Keep it conversational (1-2 sentences)
- Stay completely in character
- DO NOT sound like an AI assistant
- DO NOT use phrases like "How can I help" or "I'm here to assist"

Your response as ${scenario.character_name}:`;
}

function getStageGuidelines(stage: string, role: string, userRole: string): string {
  const guidelines: Record<string, Record<string, string>> = {
    opening: {
      sales: `Be welcoming but busy. You have specific needs. Ask clarifying questions about their offering.`,
      'project-manager': `Be professional and focused. You need to understand scope and timeline. Ask about deliverables.`,
      'product-manager': `Be curious about their proposal. You need to understand user impact. Ask about requirements.`,
      'support-agent': `Be helpful but need to understand the issue. Ask specific questions about the problem.`,
      'manager': `Be approachable but direct. You need to understand the situation. Ask for context.`,
      'leader': `Be strategic and forward-thinking. You need to understand bigger picture. Ask about vision.`,
      'default': `Be professional and engaged. Show interest but ask clarifying questions.`
    },
    middle: {
      sales: `Engage with their proposal. Present your specific challenges. Ask about ROI and implementation.`,
      'project-manager': `Discuss details and challenges. Ask about resources, timeline, and risks.`,
      'product-manager': `Dive into features and user needs. Ask about prioritization and technical feasibility.`,
      'support-agent': `Work through the solution steps. Ask follow-up questions to ensure understanding.`,
      'manager': `Discuss implications and next steps. Ask about resources and support needed.`,
      'leader': `Explore strategic alignment. Ask about change management and organizational impact.`,
      'default': `Engage with their ideas. Ask detailed questions and present realistic challenges.`
    },
    closing: {
      sales: `Consider next steps. Ask about pricing, timeline, and decision process.`,
      'project-manager': `Wrap up with clear action items. Ask about next meeting and deliverables.`,
      'product-manager': `Summarize decisions. Ask about implementation timeline and success metrics.`,
      'support-agent': `Confirm resolution. Ask if there are any other questions or concerns.`,
      'manager': `Establish follow-up plans. Ask about check-ins and support needed.`,
      'leader': `Align on vision and next steps. Ask about communication and rollout strategy.`,
      'default': `Work toward resolution. Ask about next steps and follow-up actions.`
    }
  };

  return guidelines[stage][role] || guidelines[stage]['default'];
}

function isAILikeResponse(response: string): boolean {
  const aiPhrases = [
    'how can i help',
    'how may i assist',
    'i\'m here to help',
    'i\'m an ai',
    'as an ai',
    'i don\'t have personal',
    'i\'m not able to',
    'i cannot',
    'i\'m designed to',
    'my purpose is',
    'i was created to',
    'let me assist you',
    'how can i be of service',
    'what can i do for you'
  ];
  
  const lowerResponse = response.toLowerCase();
  return aiPhrases.some(phrase => lowerResponse.includes(phrase));
}

function shouldEndConversation(conversationHistory: any[]): boolean {
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  // Natural ending after 8+ exchanges
  if (exchanges >= 12) return true;
  if (exchanges >= 8) {
    // Check if conversation seems to be concluding
    const lastMessages = conversationHistory.slice(-4);
    const recentText = lastMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    const conclusionWords = [
      'thank you', 'thanks', 'appreciate', 'sounds good', 'perfect', 'great', 
      'next steps', 'follow up', 'talk soon', 'meeting', 'call', 'email',
      'decision', 'think about', 'discuss internally', 'get back'
    ];
    
    const conclusionCount = conclusionWords.filter(word => recentText.includes(word)).length;
    return conclusionCount >= 2;
  }
  
  return false;
}

function determineEmotion(conversationHistory: any[], scenario: any): string {
  const exchanges = Math.floor(conversationHistory.length / 2);
  const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
  const recentUserText = userMessages.slice(-2).map(msg => msg.message.toLowerCase()).join(' ');
  
  // Analyze user engagement and scenario type
  const positiveWords = ['great', 'excellent', 'perfect', 'interested', 'love', 'amazing'];
  const concernWords = ['concerned', 'worried', 'issue', 'problem', 'challenge', 'difficult'];
  const questionWords = ['what', 'how', 'when', 'why', 'where', 'can you', 'would you'];
  
  const positiveCount = positiveWords.filter(word => recentUserText.includes(word)).length;
  const concernCount = concernWords.filter(word => recentUserText.includes(word)).length;
  const questionCount = questionWords.filter(word => recentUserText.includes(word)).length;
  
  if (exchanges >= 8) return 'satisfied';
  if (positiveCount > 0) return 'pleased';
  if (concernCount > 0) return 'concerned';
  if (questionCount > 1) return 'curious';
  if (exchanges >= 4) return 'engaged';
  return 'professional';
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
    .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
    .replace(/^\*|\*$/g, '') // Remove markdown italic
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^(As |I am |I'm |My name is |Hello,? I'm |Hi,? I'm )/i, '') // Remove AI-like introductions
    .replace(/(How can I help|How may I assist|What can I do for)/i, '') // Remove assistant language
    .replace(/^(Sure|Certainly|Of course|Absolutely)[,!]?\s*/i, '') // Remove AI affirmations
    .trim();
}

function generateContextualFallback(scenario: any, userMessage: string, conversationHistory: any[]) {
  console.log('🔄 Using enhanced contextual fallback');
  
  const exchanges = Math.floor((conversationHistory?.length || 0) / 2);
  const userRole = getUserRole(scenario?.role || 'sales');
  
  // Context-aware responses based on what user said and conversation stage
  const responseTemplates: Record<string, any> = {
    'sales': {
      opening: [
        "That's interesting. Can you tell me more about how this would specifically help our company?",
        "I see. What makes your solution different from what we're currently using?",
        "Help me understand - what kind of results have other companies like ours seen?"
      ],
      middle: [
        "That's a good point. What would the implementation process look like for us?",
        "I appreciate that information. What kind of timeline are we looking at?",
        "That sounds promising. What are the costs involved?"
      ],
      closing: [
        "I need to think about this. What are the next steps if we want to move forward?",
        "This seems like it could work for us. Who else would need to be involved in this decision?",
        "Let me discuss this with my team. When could we schedule a follow-up?"
      ]
    },
    'project-manager': {
      opening: [
        "Thanks for bringing this up. What are the main challenges we need to address?",
        "I understand. How does this affect our current timeline?",
        "That's helpful context. What resources would we need for this?"
      ],
      middle: [
        "Good point. How should we communicate this to the stakeholders?",
        "I see the complexity here. What are the biggest risks we should consider?",
        "That makes sense. How do we ensure we stay on track with deliverables?"
      ],
      closing: [
        "Alright, let's define the action items. Who's responsible for what?",
        "I think we have a path forward. When should we check in on progress?",
        "This sounds like a solid plan. What do you need from me to make this successful?"
      ]
    },
    'support-agent': {
      opening: [
        "I understand your frustration. Let me see how I can help resolve this issue.",
        "That sounds concerning. Can you walk me through exactly what happened?",
        "I appreciate you explaining that. Let me check what options we have available."
      ],
      middle: [
        "That makes sense. Have you tried restarting the application?",
        "I see the problem. Let me check if this is a known issue on our end.",
        "That's helpful information. Can you try these steps and let me know what happens?"
      ],
      closing: [
        "Great! It sounds like that resolved the issue. Is there anything else I can help with?",
        "Perfect. I'll make sure to document this solution for future reference.",
        "I'm glad we got that sorted out. Don't hesitate to reach out if you need more help."
      ]
    },
    'manager': {
      opening: [
        "Thanks for bringing this to my attention. What's your perspective on the situation?",
        "I appreciate you coming to me with this. Can you help me understand the context?",
        "That's an important point. What do you think would be the best approach?"
      ],
      middle: [
        "I see what you mean. What kind of support would be most helpful?",
        "That's valuable feedback. How do you think we should move forward?",
        "Good insight. What obstacles do you see, and how might we address them?"
      ],
      closing: [
        "This has been a productive conversation. What are your next steps?",
        "I think we have a clear path forward. How can I support you on this?",
        "Let's schedule a follow-up to check on progress. When works best for you?"
      ]
    },
    'leader': {
      opening: [
        "That's an important strategic consideration. How do you see this fitting with our goals?",
        "I appreciate you thinking about the bigger picture. What's driving this initiative?",
        "That's insightful. How do you think this will impact the team and organization?"
      ],
      middle: [
        "I see the potential here. What would successful implementation look like?",
        "That's a compelling vision. What are the key milestones we should focus on?",
        "Good thinking. How do we ensure this aligns with our organizational values?"
      ],
      closing: [
        "This sounds like a strategic priority. How do we build momentum around this?",
        "I'm excited about this direction. What resources do you need to make it happen?",
        "Let's create a roadmap for this. When should we reconvene to track progress?"
      ]
    }
  };
  
  // Determine conversation stage
  const stage = exchanges < 3 ? 'opening' : exchanges < 6 ? 'middle' : 'closing';
  
  // Get appropriate responses for the role and stage
  const roleResponses = responseTemplates[scenario?.role] || responseTemplates['sales'];
  const stageResponses = roleResponses[stage] || roleResponses['opening'];
  
  // Select a contextual response
  let selectedResponse = stageResponses[Math.floor(Math.random() * stageResponses.length)];
  
  // Make response more contextual based on user message
  if (userMessage?.toLowerCase().includes('price') || userMessage?.toLowerCase().includes('cost')) {
    if (scenario?.role === 'sales') {
      selectedResponse = "That's an important consideration. Can you help me understand your budget range for this type of solution?";
    }
  } else if (userMessage?.toLowerCase().includes('time') || userMessage?.toLowerCase().includes('when')) {
    selectedResponse = "Good question about timing. What's driving the urgency on your end?";
  } else if (userMessage?.toLowerCase().includes('team') || userMessage?.toLowerCase().includes('people')) {
    selectedResponse = "That's a key point about the team. How many people would this impact?";
  }

  return Response.json({
    success: true,
    data: {
      response: selectedResponse,
      character: scenario?.character_name || 'Professional Contact',
      emotion: determineEmotion(conversationHistory || [], scenario),
      shouldEndConversation: shouldEndConversation(conversationHistory || []),
      model: 'enhanced-contextual-fallback'
    }
  });
}
