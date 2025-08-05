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
    console.log('👤 User is practicing as:', getTrainerRole(scenario.role));

    const emotion = determineAdvancedEmotionProgression(messageCount || 0, conversationHistory, userMessage, scenario);
    const conversationStage = getConversationStage(messageCount || 0, scenario.role);
    
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

// Updated role mappings
function getTrainerRole(role: string): string {
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
  return roleMap[role] || 'professional';
}

function getTrainerObjective(role: string): string {
  const objectiveMap: Record<string, string> = {
    'sales': 'sell you a solution and understand your needs',
    'project-manager': 'coordinate projects and manage stakeholders effectively',
    'product-manager': 'define product strategy and gather requirements',
    'leader': 'provide vision and strategic guidance',
    'manager': 'lead teams and manage performance effectively',
    'strategy-lead': 'develop strategic initiatives and drive execution',
    'support-agent': 'help resolve your customer service issue',
    'data-analyst': 'analyze data and provide insights for decision making',
    'engineer': 'discuss technical solutions and development approaches',
    'nurse': 'provide you with medical care and support',
    'doctor': 'provide you with medical care and diagnosis'
  };
  return objectiveMap[role] || 'help you professionally';
}

function getConversationStage(messageCount: number, role: string) {
  if (messageCount === 0) return 'Initial Contact';
  if (messageCount < 3) return 'Rapport Building';
  if (messageCount < 6) return getMiddleStage(role);
  if (messageCount < 9) return 'Solution Discussion';
  return 'Decision Making';
}

function getMiddleStage(role: string): string {
  const stageMap: Record<string, string> = {
    'sales': 'Needs Discovery',
    'project-manager': 'Requirements Gathering',
    'product-manager': 'Feature Discussion',
    'leader': 'Vision Alignment',
    'manager': 'Performance Review',
    'strategy-lead': 'Strategic Planning',
    'support-agent': 'Issue Diagnosis',
    'data-analyst': 'Data Analysis',
    'engineer': 'Technical Design',
    'nurse': 'Assessment',
    'doctor': 'Symptom Assessment'
  };
  return stageMap[role] || 'Information Gathering';
}

// Advanced character prompt building
function buildAdvancedCharacterPrompt(scenario: any, userMessage: string, conversationHistory: any[], emotion: string, messageCount: number, conversationStage: string) {
  // Build contextual conversation history
  let contextualHistory = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6); // More context for better responses
    contextualHistory = recentHistory.map((msg: any) => 
      `${msg.speaker === 'user' ? getTrainerRole(scenario.role).toUpperCase() : scenario.character_name.toUpperCase()}: ${msg.message}`
    ).join('\n');
  }

  const trainerRole = getTrainerRole(scenario.role);
  const characterMotivation = getCharacterMotivation(scenario.role);
  const industryContext = getIndustryContext(scenario.role);
  
  return `You are ${scenario.character_name}, a ${scenario.character_role} in a ${scenario.role} scenario.

CRITICAL INSTRUCTIONS:
- You are NOT a trainer or coach. You ARE the character being practiced with.
- Respond naturally as someone in your position would respond to a ${trainerRole}.
- Show realistic human emotions, concerns, and reactions.
- Your goal is to be a challenging but realistic practice partner.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || getDefaultPersonality(scenario.role)}
- Current Emotional State: ${emotion}
- Conversation Stage: ${conversationStage}

SCENARIO CONTEXT:
${scenario.description || `You are in a ${scenario.role} conversation with a ${trainerRole}`}

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
2. Have realistic ${scenario.role} concerns, needs, and objections
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
      `${msg.speaker === 'user' ? getTrainerRole(scenario.role).toUpperCase() : scenario.character_name.toUpperCase()}: ${msg.message}`
    ).join('\n');
  }

  const trainerRole = getTrainerRole(scenario.role);
  const stage = getConversationStage(messageCount, scenario.role);
  
  return `You are ${scenario.character_name}, a ${scenario.character_role} in a ${scenario.role} scenario.

IMPORTANT: You are NOT a trainer or coach. You ARE the character that someone is practicing with.

CHARACTER PROFILE:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || 'Professional but has real needs and concerns'}
- Current Mood: ${emotion}
- Industry: ${scenario.role}

SITUATION:
${scenario.description || `You are in a ${scenario.role} conversation`}

THE PERSON TALKING TO YOU:
- They are a ${trainerRole} (practicing their skills)
- They are trying to ${getTrainerObjective(scenario.role)}
- Respond as the CHARACTER would respond to a ${trainerRole}

CONVERSATION STAGE: ${stage}

${contextualHistory ? `RECENT CONVERSATION:\n${contextualHistory}\n` : ''}

THE ${trainerRole.toUpperCase()} JUST SAID: "${userMessage}"

INSTRUCTIONS FOR YOU AS ${scenario.character_name}:
- BE the ${scenario.character_role}, don't act like a trainer
- Respond naturally as someone in your position would
- Show ${emotion} personality based on the conversation flow
- Have realistic ${scenario.role} concerns and needs
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

  // Default progression based on conversation stage and role
  const roleProgression: Record<string, string[]> = {
    'sales': ['professional', 'curious', 'interested', 'concerned', 'engaged', 'interested'],
    'project-manager': ['professional', 'focused', 'analytical', 'collaborative', 'engaged'],
    'product-manager': ['professional', 'curious', 'strategic', 'engaged', 'collaborative'],
    'leader': ['professional', 'visionary', 'strategic', 'engaged', 'decisive'],
    'manager': ['professional', 'supportive', 'evaluative', 'engaged', 'developmental'],
    'strategy-lead': ['professional', 'analytical', 'strategic', 'engaged', 'decisive'],
    'support-agent': ['frustrated', 'concerned', 'engaged', 'satisfied'],
    'data-analyst': ['professional', 'analytical', 'curious', 'engaged', 'insightful'],
    'engineer': ['professional', 'technical', 'analytical', 'engaged', 'collaborative'],
    'nurse': ['professional', 'caring', 'concerned', 'engaged', 'supportive'],
    'doctor': ['professional', 'concerned', 'curious', 'engaged', 'analytical']
  };

  const progression = roleProgression[scenario.role as string] || roleProgression['sales'];
  const stageIndex = Math.min(messageCount - 1, progression.length - 1);
  
  return progression[stageIndex] || 'professional';
}

// Get character motivation based on role
function getCharacterMotivation(role: string): string {
  const motivations: Record<string, string> = {
    'sales': 'You need to evaluate if this solution will actually help your business. You want to understand the ROI, implementation process, and how it compares to alternatives. You are cautious about making the wrong decision.',
    'project-manager': 'You need clear project requirements, realistic timelines, and want to ensure all stakeholders are aligned. You are focused on successful project delivery and managing risks.',
    'product-manager': 'You want to understand user needs, market opportunities, and how features will impact product success. You need to balance user value with business objectives and technical feasibility.',
    'leader': 'You are focused on strategic outcomes, organizational alignment, and how initiatives support the company vision. You want to understand the broader impact and long-term implications.',
    'manager': 'You want to support your team member\'s growth while ensuring performance standards are met. You need to balance individual development with team and organizational needs.',
    'strategy-lead': 'You need to evaluate strategic initiatives for market impact, competitive advantage, and organizational capabilities. You want to ensure alignment with overall business strategy.',
    'support-agent': 'You have a problem that needs solving and you want quick, effective help. You may be frustrated if the issue has been ongoing and need to see that the support person understands your situation.',
    'data-analyst': 'You want to understand the business questions, data requirements, and analytical methods that will provide actionable insights for decision-making.',
    'engineer': 'You are focused on technical feasibility, system architecture, implementation details, and ensuring the solution is scalable, maintainable, and secure.',
    'nurse': 'You are committed to providing excellent patient care and need clear communication about procedures, care plans, and coordination with the medical team.',
    'doctor': 'You need to gather comprehensive patient information, make accurate diagnoses, and develop appropriate treatment plans while ensuring patient understanding and comfort.'
  };
  
  return motivations[role] || motivations['sales'];
}

// Get industry context for better responses
function getIndustryContext(role: string): string {
  const contexts: Record<string, string> = {
    'sales': 'This is a B2B sales environment where the character is evaluating solutions for their business. They need to justify purchases to stakeholders and are focused on ROI, implementation, and competitive advantages.',
    'project-manager': 'This is a project management environment requiring coordination, planning, and stakeholder communication. Success depends on clear requirements, realistic timelines, and effective risk management.',
    'product-manager': 'This is a product development environment focused on user needs, market opportunities, and feature prioritization. Decisions must balance user value, business impact, and technical feasibility.',
    'leader': 'This is a leadership environment requiring vision communication, strategic thinking, and organizational influence. Focus is on long-term impact and alignment with company objectives.',
    'manager': 'This is a people management environment focused on team development, performance management, and individual growth while maintaining team productivity and morale.',
    'strategy-lead': 'This is a strategic planning environment requiring market analysis, competitive intelligence, and long-term thinking about organizational direction and capabilities.',
    'support-agent': 'This is a customer service environment where the character has a problem that needs resolution. They want efficient service and may be frustrated if the issue has been ongoing.',
    'data-analyst': 'This is an analytics environment focused on data interpretation, statistical analysis, and translating data into actionable business insights and recommendations.',
    'engineer': 'This is a technical development environment requiring problem-solving, system design, and implementation planning with focus on scalability and maintainability.',
    'nurse': 'This is a healthcare environment focused on patient care, medical procedures, and healthcare team collaboration with emphasis on patient safety and comfort.',
    'doctor': 'This is a medical consultation environment focused on diagnosis, treatment planning, and patient communication with emphasis on clinical expertise and patient care.'
  };
  
  return contexts[role] || contexts['sales'];
}

// Get default personality based on role
function getDefaultPersonality(role: string): string {
  const personalities: Record<string, string> = {
    'sales': 'Analytical, budget-conscious, needs to justify decisions to stakeholders, values concrete benefits and ROI',
    'project-manager': 'Organized, deadline-focused, collaborative, concerned about scope and resource management',
    'product-manager': 'Strategic, user-focused, data-driven, balances multiple stakeholder needs and priorities',
    'leader': 'Visionary, strategic, focused on organizational impact and long-term success',
    'manager': 'Supportive, development-oriented, balances individual growth with team performance',
    'strategy-lead': 'Analytical, forward-thinking, focused on competitive advantage and market positioning',
    'support-agent': 'Problem-focused, wants quick resolution, may be frustrated with ongoing issues',
    'data-analyst': 'Detail-oriented, evidence-based, focused on accuracy and actionable insights',
    'engineer': 'Technical, logical, focused on implementation details and system architecture',
    'nurse': 'Caring, patient-focused, detail-oriented about procedures and patient safety',
    'doctor': 'Clinical, analytical, focused on accurate diagnosis and appropriate treatment'
  };
  
  return personalities[role] || personalities['sales'];
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
    'project-manager': [
      "What's the timeline for this project? I need to understand the scope and deliverables.",
      "How does this align with our current project priorities and resource allocation?",
      "What are the key milestones and dependencies we need to consider?",
      "Who are the stakeholders that need to be involved in this project?",
      "What risks should we be aware of and how can we mitigate them?"
    ],
    'product-manager': [
      "How does this feature align with our product roadmap and user research findings?",
      "What's the expected impact on user engagement and business metrics?",
      "Have we validated this concept with our target user segments?",
      "What's the priority of this feature compared to other items in our backlog?",
      "How will we measure the success of this feature after launch?"
    ],
    'leader': [
      "How does this initiative support our strategic objectives and company vision?",
      "What's the expected ROI and how does this compare to other strategic priorities?",
      "How will we measure success and what are the key performance indicators?",
      "What resources and organizational changes will be required?",
      "How does this position us competitively in the market?"
    ],
    'manager': [
      "I've been handling this responsibility effectively. What specific areas need improvement?",
      "Can you provide context about how this feedback aligns with team goals?",
      "What support and resources are available to help me develop in this area?",
      "How does this relate to my career development and growth opportunities?",
      "What's the timeline for implementing these changes?"
    ],
    'strategy-lead': [
      "What market research supports this strategic direction?",
      "How does this initiative differentiate us from competitors?",
      "What are the potential risks and how do we plan to mitigate them?",
      "What's the expected timeline and resource requirements for execution?",
      "How does this align with our overall strategic roadmap?"
    ],
    'support-agent': [
      "I'm experiencing this issue and need a resolution. What troubleshooting steps should I try?",
      "This problem is affecting my productivity. How quickly can we resolve this?",
      "I've tried the basic solutions already. What's the next level of support?",
      "Can you escalate this to someone who can provide a permanent fix?",
      "What's the root cause of this issue and how can we prevent it in the future?"
    ],
    'data-analyst': [
      "What data sources should I analyze to answer this business question?",
      "How should I structure this analysis to provide actionable insights?",
      "What statistical methods would be most appropriate for this dataset?",
      "What's the timeline for this analysis and what format should the deliverable be?",
      "Are there any specific metrics or KPIs I should focus on?"
    ],
    'engineer': [
      "What are the technical requirements and constraints for this feature?",
      "How should we architect this solution for scalability and maintainability?",
      "What are the potential technical risks and how do we mitigate them?",
      "What's the estimated development timeline and resource requirements?",
      "How does this integrate with our existing systems and infrastructure?"
    ],
    'nurse': [
      "What's the proper protocol for this patient care situation?",
      "How should I prioritize these patient needs and coordinate with the medical team?",
      "What documentation and follow-up care is required?",
      "Are there any safety considerations I should be aware of?",
      "How should I communicate this information to the patient and family?"
    ],
    'doctor': [
      "Based on these symptoms, what diagnostic tests should we consider?",
      "What are the treatment options and their potential side effects?",
      "How should we monitor the patient's progress and adjust treatment?",
      "What's the prognosis and expected timeline for recovery?",
      "Are there any lifestyle changes or preventive measures the patient should know about?"
    ]
  };
  
  const role = scenario?.role || 'sales';
  const responses = characterResponses[role] || characterResponses['sales'];
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
