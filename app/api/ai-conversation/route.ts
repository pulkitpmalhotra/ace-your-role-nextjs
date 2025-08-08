// app/api/ai-conversation/route.ts - Fixed with Better Error Handling & Environment Setup
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

    // Check for Google API key - try both environment variable names
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.error('❌ Missing Google API key. Check environment variables: GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY');
      return generateContextualFallback(scenario, userMessage, conversationHistory);
    }

    console.log('🤖 Generating AI response with Vercel AI SDK + Gemini...');

    // Build enhanced conversation prompt
    const prompt = buildEnhancedConversationPrompt(scenario, userMessage, conversationHistory);

    try {
      // Use Vercel AI SDK with Gemini
      // Note: If using GOOGLE_AI_API_KEY, you may need to create a custom provider
      let model;
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        // Use default provider
        model = google('gemini-2.0-flash-exp');
      } else {
        // Create custom provider for GOOGLE_AI_API_KEY
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const customGoogle = createGoogleGenerativeAI({
          apiKey: GOOGLE_AI_API_KEY,
        });
        model = customGoogle('gemini-2.0-flash-exp');
      }

      const { text: aiResponse } = await generateText({
        model: model,
        prompt: prompt,
        temperature: 0.9, // Higher for more natural responses
        maxTokens: 200, // Shorter for conversation flow
        topP: 0.95,
        topK: 40,
        frequencyPenalty: 0.3, // Reduce repetition
        presencePenalty: 0.2, // Encourage diverse responses
      });

      if (!aiResponse || aiResponse.trim().length === 0) {
        console.error('❌ Empty response from Gemini API');
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

      console.log('✅ AI response generated successfully');

      return Response.json({
        success: true,
        data: {
          response: cleanResponse,
          character: scenario.character_name,
          emotion: emotion,
          shouldEndConversation: shouldEnd,
          model: 'gemini-2.0-flash-exp'
        }
      });

    } catch (aiError: any) {
      console.error('❌ Vercel AI SDK error:', aiError);
      
      // Check if it's an API key issue
      if (aiError.message?.includes('API key') || aiError.message?.includes('authentication')) {
        console.error('🔑 API Key authentication failed. Check your Google API key configuration.');
      }
      
      // Check if it's a rate limit issue
      if (aiError.message?.includes('quota') || aiError.message?.includes('rate limit')) {
        console.error('⏰ API rate limit exceeded. Using fallback.');
      }
      
      return generateContextualFallback(scenario, userMessage, conversationHistory);
    }

  } catch (error) {
    console.error('❌ AI Conversation general error:', error);
    
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
      sales: `Be welcoming but curious. You have specific business needs. Ask clarifying questions about their offering and how it addresses your challenges.`,
      'project-manager': `Be professional and focused. You need to understand scope and timeline. Ask about deliverables and project requirements.`,
      'product-manager': `Be curious about their proposal. You need to understand user impact. Ask about requirements and feasibility.`,
      'support-agent': `You're frustrated with an issue. Need help urgently. Ask specific questions about the problem you're experiencing.`,
      'manager': `Be approachable but direct. You need to understand the situation. Ask for context and their perspective.`,
      'leader': `Be strategic and forward-thinking. You need to understand bigger picture. Ask about vision and alignment.`,
      'default': `Be professional and engaged. Show interest but ask clarifying questions about their proposal.`
    },
    middle: {
      sales: `Engage with their proposal. Present your specific business challenges. Ask about ROI, implementation, and costs.`,
      'project-manager': `Discuss details and challenges. Ask about resources, timeline, risks, and stakeholder communication.`,
      'product-manager': `Dive into features and user needs. Ask about prioritization, technical feasibility, and roadmap alignment.`,
      'support-agent': `Work through the solution steps. Ask follow-up questions to ensure you understand the fix.`,
      'manager': `Discuss implications and next steps. Ask about resources, support needed, and implementation details.`,
      'leader': `Explore strategic alignment. Ask about change management, organizational impact, and success metrics.`,
      'default': `Engage with their ideas. Ask detailed questions and present realistic challenges or concerns.`
    },
    closing: {
      sales: `Consider next steps seriously. Ask about pricing, timeline, decision process, and implementation support.`,
      'project-manager': `Wrap up with clear action items. Ask about next meeting, deliverables, and progress tracking.`,
      'product-manager': `Summarize decisions made. Ask about implementation timeline, success metrics, and team coordination.`,
      'support-agent': `Confirm the resolution works. Ask if there are any other questions or follow-up needed.`,
      'manager': `Establish follow-up plans. Ask about check-ins, support needed, and success measures.`,
      'leader': `Align on vision and next steps. Ask about communication strategy and rollout planning.`,
      'default': `Work toward resolution. Ask about specific next steps and follow-up actions.`
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
  console.log('🔄 Using character-aware contextual fallback');
  
  const exchanges = Math.floor((conversationHistory?.length || 0) / 2);
  const characterName = scenario?.character_name || 'Professional Contact';
  const characterRole = scenario?.character_role || 'Professional';
  
  // Character-aware responses based on what the CHARACTER would say in their role
  const characterResponseTemplates: Record<string, any> = {
    'sales': {
      // Character is a PROSPECT/CLIENT responding to a salesperson
      opening: [
        "That's interesting. Can you tell me more about how this would specifically help our company?",
        "I see. What makes your solution different from what we're currently using?",
        "Help me understand - what kind of results have other companies like ours seen?",
        "We've been looking for a solution like this. What's your approach?"
      ],
      middle: [
        "That's a good point. What would the implementation process look like for us?",
        "I appreciate that information. What kind of timeline are we looking at?",
        "That sounds promising. What are the costs involved?",
        "How would this integrate with our current systems?"
      ],
      closing: [
        "I need to think about this. What are the next steps if we want to move forward?",
        "This seems like it could work for us. Who else would need to be involved in this decision?",
        "Let me discuss this with my team. When could we schedule a follow-up?",
        "What kind of support do you provide during implementation?"
      ]
    },
    'project-manager': {
      // Character is a STAKEHOLDER/TEAM MEMBER responding to a project manager
      opening: [
        "Thanks for bringing this up. What are the main challenges we need to address?",
        "I understand. How does this affect our current timeline?",
        "That's helpful context. What resources would we need for this?",
        "I have some concerns about the scope. Can we discuss them?"
      ],
      middle: [
        "Good point. How should we communicate this to the stakeholders?",
        "I see the complexity here. What are the biggest risks we should consider?",
        "That makes sense. How do we ensure we stay on track with deliverables?",
        "What's the impact on our other priorities?"
      ],
      closing: [
        "Alright, let's define the action items. Who's responsible for what?",
        "I think we have a path forward. When should we check in on progress?",
        "This sounds like a solid plan. What do you need from me to make this successful?",
        "How will we measure success on this project?"
      ]
    },
    'product-manager': {
      // Character is a STAKEHOLDER responding to a product manager
      opening: [
        "I'm interested in hearing your thoughts on this feature request.",
        "Our users have been asking about this. What's your take?",
        "How does this fit with our product roadmap?",
        "What data do we have to support this decision?"
      ],
      middle: [
        "That's an interesting perspective. What about the technical feasibility?",
        "How would this impact our current user experience?",
        "What's the expected timeline for something like this?",
        "Have you considered the resource requirements?"
      ],
      closing: [
        "I think we need to prioritize this. What are the next steps?",
        "Let's get the engineering team's input on this.",
        "When can we see a prototype or mockup?",
        "How should we communicate this to the users?"
      ]
    },
    'support-agent': {
      // Character is a CUSTOMER with an issue responding to support
      opening: [
        "I'm really frustrated with this issue. It's been going on for days.",
        "I've tried everything I can think of and nothing works.",
        "This is affecting my ability to get work done. Can you help?",
        "I'm not very technical, so I need simple instructions."
      ],
      middle: [
        "Okay, I tried that but it's still not working. What else can we do?",
        "That seems complicated. Is there an easier way?",
        "I think it's working better now, but I'm still seeing some issues.",
        "How long should this take to fully resolve?"
      ],
      closing: [
        "Great! That seems to have fixed it. Thank you so much.",
        "Perfect. Is there anything I should do to prevent this in the future?",
        "I really appreciate your help. You've been very patient with me.",
        "Should I contact you if this happens again?"
      ]
    },
    'manager': {
      // Character is a TEAM MEMBER responding to their manager
      opening: [
        "Thanks for meeting with me. I wanted to discuss my progress on the project.",
        "I appreciate you taking the time. I have some concerns I'd like to share.",
        "I've been thinking about our conversation last week.",
        "I wanted to get your feedback on how things are going."
      ],
      middle: [
        "That's helpful feedback. How can I improve in that area?",
        "I understand your point. What would success look like?",
        "That makes sense. What support do I need to get there?",
        "I'm struggling with this particular challenge. Any advice?"
      ],
      closing: [
        "This has been really helpful. What should I focus on next?",
        "I feel much clearer about the expectations. Thank you.",
        "When should we check in again on my progress?",
        "I'm committed to making these improvements."
      ]
    },
    'leader': {
      // Character is a TEAM MEMBER responding to leadership
      opening: [
        "I'm excited about the direction you're proposing for our team.",
        "I have some questions about the new strategy.",
        "The team has been talking about this change. Can we discuss it?",
        "I want to make sure I understand the vision correctly."
      ],
      middle: [
        "That's inspiring. How can I help drive this initiative?",
        "I see the big picture. What's my role in making this happen?",
        "The team seems motivated by this direction.",
        "What obstacles do you anticipate we'll face?"
      ],
      closing: [
        "I'm fully on board with this plan. What are my next steps?",
        "How should I communicate this to my team?",
        "I'm excited to start implementing these changes.",
        "When should we reconvene to discuss progress?"
      ]
    }
  };
  
  // Default responses for unknown roles
  const defaultResponses = {
    opening: [
      "That's an interesting point. Could you elaborate on that?",
      "I see what you're saying. Can you help me understand your perspective?",
      "Thanks for bringing that up. What are your thoughts on next steps?"
    ],
    middle: [
      "That makes sense. How do you think we should proceed?",
      "I appreciate that insight. What else should we consider?",
      "Good point. What would you recommend?"
    ],
    closing: [
      "This has been a productive discussion. What should we do next?",
      "I think we've covered a lot. How should we move forward?",
      "Thank you for the information. What are the next steps?"
    ]
  };
  
  // Determine conversation stage
  const stage = exchanges < 3 ? 'opening' : exchanges < 6 ? 'middle' : 'closing';
  
  // Get appropriate responses for the character's role and stage
  const roleResponses = characterResponseTemplates[scenario?.role] || defaultResponses;
  const stageResponses = roleResponses[stage] || defaultResponses[stage];
  
  // Select a contextual response
  let selectedResponse = stageResponses[Math.floor(Math.random() * stageResponses.length)];
  
  // Make response more contextual based on user message content
  if (userMessage?.toLowerCase().includes('price') || userMessage?.toLowerCase().includes('cost')) {
    if (scenario?.role === 'sales') {
      selectedResponse = "That's an important consideration. What budget range are you working with for this type of solution?";
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
      character: characterName,
      emotion: determineEmotion(conversationHistory || [], scenario),
      shouldEndConversation: shouldEndConversation(conversationHistory || []),
      model: 'character-aware-fallback'
    }
  });
}
