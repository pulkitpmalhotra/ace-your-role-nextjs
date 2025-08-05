// app/session/[id]/page.tsx - Updated interface and role handling

// Updated Scenario interface
interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  character_personality?: string;
  difficulty: string;
  role: string;  // Changed from category to role
}

// Updated greeting generation for new roles
const generateEnhancedGreeting = async (scenario: Scenario) => {
  if (aiPromptingRef.current) {
    return await aiPromptingRef.current.generateContextualResponse(
      "Generate an opening greeting",
      [],
      {
        character: scenario.character_name,
        scenario: scenario.title,
        emotionalContext: 'professional',
        conversationFlow: { turnCount: 0, averageLength: 0, lastSpeaker: 'none' }
      }
    );
  }
  
  // Updated fallback greetings for new roles
  const greetings: Record<string, string[]> = {
    'sales': [
      `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss our business needs?`,
      `Hello! ${scenario.character_name} here. I have about 15 minutes to chat about what you're offering.`,
      `Good morning! I'm ${scenario.character_name}. I've been looking at solutions like yours - what makes yours different?`
    ],
    'project-manager': [
      `Hi, I'm ${scenario.character_name}. I wanted to discuss the project timeline and requirements with you.`,
      `Good morning! ${scenario.character_name} here. Let's talk about resource allocation and project priorities.`,
      `Hello! I'm ${scenario.character_name}. I need to understand the scope and deliverables for this project.`
    ],
    'product-manager': [
      `Hi, I'm ${scenario.character_name}. I'd like to review the product roadmap and feature priorities.`,
      `Good afternoon! ${scenario.character_name} here. Let's discuss user requirements and product strategy.`,
      `Hello! I'm ${scenario.character_name}. I want to understand how this feature aligns with our product vision.`
    ],
    'leader': [
      `Good morning! I'm ${scenario.character_name}. I wanted to discuss our strategic direction and vision.`,
      `Hi, ${scenario.character_name} here. Let's talk about how this initiative supports our organizational goals.`,
      `Hello! I'm ${scenario.character_name}. I need to understand the strategic impact of this proposal.`
    ],
    'manager': [
      `Good morning! I'm ${scenario.character_name}. I wanted to discuss your recent performance and development.`,
      `Hi, ${scenario.character_name} here. Let's have our regular check-in about your projects and goals.`,
      `Hello! I'm ${scenario.character_name}. I'd like to provide some feedback and discuss your career growth.`
    ],
    'strategy-lead': [
      `Hi, I'm ${scenario.character_name}. I wanted to review our market analysis and strategic initiatives.`,
      `Good morning! ${scenario.character_name} here. Let's discuss the competitive landscape and our positioning.`,
      `Hello! I'm ${scenario.character_name}. I need to understand how this fits into our strategic roadmap.`
    ],
    'support-agent': [
      `Hi, this is ${scenario.character_name}. I'm calling because I'm having issues with your service.`,
      `Hello, ${scenario.character_name} here. I need help with my account - I've been trying to resolve this for days.`,
      `Good afternoon! I'm ${scenario.character_name}. Your system isn't working properly and I need assistance.`
    ],
    'data-analyst': [
      `Hi, I'm ${scenario.character_name}. I wanted to discuss the data analysis requirements for this project.`,
      `Good morning! ${scenario.character_name} here. Let's review the metrics and insights from our recent analysis.`,
      `Hello! I'm ${scenario.character_name}. I need to understand what data questions we're trying to answer.`
    ],
    'engineer': [
      `Hi, I'm ${scenario.character_name}. I wanted to discuss the technical requirements and architecture.`,
      `Good morning! ${scenario.character_name} here. Let's review the system design and implementation approach.`,
      `Hello! I'm ${scenario.character_name}. I have some questions about the technical specifications.`
    ],
    'nurse': [
      `Hello, I'm ${scenario.character_name}. I wanted to discuss the patient care plan and coordination.`,
      `Good morning! I'm ${scenario.character_name}. Let's review the patient's progress and next steps.`,
      `Hi, ${scenario.character_name} here. I need to update you on the patient's condition and care requirements.`
    ],
    'doctor': [
      `Hello, I'm ${scenario.character_name}. Thank you for seeing me today. I've been having some health concerns...`,
      `Good morning! I'm ${scenario.character_name}. I scheduled this appointment to discuss my symptoms and treatment options.`,
      `Hi, I'm ${scenario.character_name}. I wanted to get a second opinion on my diagnosis and treatment plan.`
    ]
  };
  
  const roleGreetings = greetings[scenario.role] || greetings['sales'];
  const selectedGreeting = roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
  
  return {
    content: selectedGreeting,
    emotion: 'professional',
    context: { greeting: true, character: scenario.character_name }
  };
};

// Updated session data structure
const sessionData = {
  scenario,
  conversation,
  duration: Math.floor((Date.now() - sessionState.startTime) / 60000),
  exchanges: Math.floor(conversation.length / 2),
  userEmail,
  sessionId: sessionState.sessionId,
  performanceMetrics,
  enhancedFeatures: true
};

// Update the enhanced AI response call to use role instead of category
const getEnhancedAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario,
      userMessage,
      conversationHistory,
      messageCount: Math.floor(conversationHistory.length / 2),
      enhancedMode: true,
      contextAwareness: true,
      performanceOptimization: true
    })
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Enhanced AI response failed');
  }
  
  return {
    response: data.data.response,
    content: data.data.response,
    emotion: data.data.emotion || 'professional',
    character: data.data.character,
    context: data.data.context || {},
    conversationStage: data.data.conversationStage,
    enhanced: data.data.enhanced || false
  };
};
