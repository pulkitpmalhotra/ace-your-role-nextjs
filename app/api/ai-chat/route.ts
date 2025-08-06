// app/api/ai-agent/route.ts - Advanced Contextual AI Agent
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

    console.log('🧠 Advanced AI Agent processing:', {
      character: scenario.character_name,
      messageCount: conversationHistory.length,
      sessionDuration: sessionState?.duration || 0
    });

    // Initialize or retrieve conversation context
    const conversationContext = await getOrCreateConversationContext(
      sessionId, 
      scenario, 
      conversationHistory
    );

    // Analyze conversation progression
    const progressionAnalysis = analyzeConversationProgression(
      conversationHistory, 
      scenario, 
      sessionState
    );

    // Determine if conversation should end
    const shouldEnd = shouldEndConversation(
      progressionAnalysis, 
      conversationHistory, 
      sessionState
    );

    // Build contextual prompt with memory
    const contextualPrompt = buildContextualPrompt(
      scenario,
      userMessage,
      conversationHistory,
      conversationContext,
      progressionAnalysis,
      shouldEnd
    );

    console.log('🎭 AI Context:', {
      stage: progressionAnalysis.currentStage,
      objectivesCompleted: progressionAnalysis.objectivesCompleted,
      shouldEnd,
      conversationDepth: progressionAnalysis.depth
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextualPrompt }] }],
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
    
    // Update conversation context
    await updateConversationContext(sessionId, {
      userMessage,
      aiResponse: cleanedResponse,
      stage: progressionAnalysis.currentStage,
      objectivesCompleted: progressionAnalysis.objectivesCompleted,
      shouldEnd
    });

    // Enhanced response with context
    const enhancedResponse = {
      response: cleanedResponse,
      character: scenario.character_name,
      emotion: determineEmotionalState(progressionAnalysis, conversationHistory),
      conversationStage: progressionAnalysis.currentStage,
      shouldEndConversation: shouldEnd,
      progressionData: {
        objectivesCompleted: progressionAnalysis.objectivesCompleted,
        conversationDepth: progressionAnalysis.depth,
        stageProgress: progressionAnalysis.stageProgress,
        naturalEndingReached: shouldEnd
      },
      model: 'contextual-ai-agent',
      contextRetained: true
    };

    console.log('✅ Contextual AI response generated:', {
      stage: progressionAnalysis.currentStage,
      shouldEnd,
      responseLength: cleanedResponse.length
    });

    return Response.json({
      success: true,
      data: enhancedResponse
    });

  } catch (error) {
    console.error('💥 Contextual AI Agent error:', error);
    return fallbackResponse(null);
  }
}

// Conversation context management
const conversationContexts = new Map<string, ConversationContext>();

interface ConversationContext {
  sessionId: string;
  scenario: any;
  startTime: number;
  objectives: string[];
  completedObjectives: Set<string>;
  conversationMemory: ConversationMemoryItem[];
  currentStage: string;
  keyTopics: Set<string>;
  characterState: {
    mood: string;
    engagement: number;
    satisfaction: number;
    concerns: string[];
    interests: string[];
  };
  lastUpdated: number;
}

interface ConversationMemoryItem {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
  topics: string[];
  emotion: string;
  importance: number; // 1-5 scale
}

async function getOrCreateConversationContext(
  sessionId: string, 
  scenario: any, 
  conversationHistory: any[]
): Promise<ConversationContext> {
  
  if (conversationContexts.has(sessionId)) {
    return conversationContexts.get(sessionId)!;
  }

  // Create new context
  const objectives = getScenarioObjectives(scenario);
  const context: ConversationContext = {
    sessionId,
    scenario,
    startTime: Date.now(),
    objectives,
    completedObjectives: new Set(),
    conversationMemory: [],
    currentStage: 'opening',
    keyTopics: new Set(),
    characterState: {
      mood: 'professional',
      engagement: 5,
      satisfaction: 5,
      concerns: [],
      interests: []
    },
    lastUpdated: Date.now()
  };

  // Populate from existing history if available
  if (conversationHistory.length > 0) {
    context.conversationMemory = conversationHistory.map(msg => ({
      speaker: msg.speaker,
      message: msg.message,
      timestamp: msg.timestamp,
      topics: extractTopics(msg.message),
      emotion: msg.emotion || 'neutral',
      importance: calculateImportance(msg.message, scenario)
    }));
    
    // Analyze existing conversation for context
    analyzeExistingConversation(context, conversationHistory);
  }

  conversationContexts.set(sessionId, context);
  return context;
}

async function updateConversationContext(
  sessionId: string, 
  update: {
    userMessage: string;
    aiResponse: string;
    stage: string;
    objectivesCompleted: string[];
    shouldEnd: boolean;
  }
) {
  const context = conversationContexts.get(sessionId);
  if (!context) return;

  // Add to memory
  context.conversationMemory.push(
    {
      speaker: 'user',
      message: update.userMessage,
      timestamp: Date.now(),
      topics: extractTopics(update.userMessage),
      emotion: 'neutral',
      importance: calculateImportance(update.userMessage, context.scenario)
    },
    {
      speaker: 'ai',
      message: update.aiResponse,
      timestamp: Date.now(),
      topics: extractTopics(update.aiResponse),
      emotion: 'professional',
      importance: 3
    }
  );

  // Update context state
  context.currentStage = update.stage;
  update.objectivesCompleted.forEach(obj => context.completedObjectives.add(obj));
  
  // Update character state based on conversation flow
  updateCharacterState(context, update);
  
  context.lastUpdated = Date.now();

  // Keep memory manageable
  if (context.conversationMemory.length > 30) {
    // Keep most important messages
    context.conversationMemory = context.conversationMemory
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}

function analyzeConversationProgression(
  conversationHistory: any[], 
  scenario: any, 
  sessionState: any
) {
  const messageCount = conversationHistory.length;
  const exchanges = Math.floor(messageCount / 2);
  const duration = sessionState?.duration || 0;

  // Analyze conversation depth and topic coverage
  const topics = new Set<string>();
  const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
  
  userMessages.forEach(msg => {
    extractTopics(msg.message).forEach(topic => topics.add(topic));
  });

  // Determine current stage based on content and flow
  const currentStage = determineConversationStage(
    conversationHistory, 
    scenario, 
    exchanges,
    duration
  );

  // Check objective completion
  const objectives = getScenarioObjectives(scenario);
  const completedObjectives = checkObjectiveCompletion(
    conversationHistory, 
    objectives, 
    scenario
  );

  // Calculate conversation depth and quality
  const depth = calculateConversationDepth(conversationHistory, scenario);

  return {
    currentStage,
    objectivesCompleted: Array.from(completedObjectives),
    depth,
    topicsCovered: Array.from(topics),
    exchanges,
    duration,
    stageProgress: calculateStageProgress(currentStage, exchanges, duration),
    readyForConclusion: checkReadyForConclusion(
      completedObjectives, 
      exchanges, 
      duration, 
      depth
    )
  };
}

function shouldEndConversation(
  progressionAnalysis: any, 
  conversationHistory: any[], 
  sessionState: any
): boolean {
  const { 
    exchanges, 
    duration, 
    objectivesCompleted, 
    depth,
    readyForConclusion 
  } = progressionAnalysis;

  // Natural ending conditions
  const conditions = {
    sufficientLength: exchanges >= 6 && duration >= 300, // 5+ minutes, 6+ exchanges
    objectivesCovered: objectivesCompleted.length >= 3,
    conversationDepth: depth >= 7, // Good conversation quality
    naturalFlow: readyForConclusion,
    timeBasedEnd: duration >= 900, // 15+ minutes
    userSignalsEnd: checkUserEndSignals(conversationHistory)
  };

  console.log('🎯 Ending conditions check:', conditions);

  // Require multiple conditions for natural ending
  const metConditions = Object.values(conditions).filter(Boolean).length;
  
  return metConditions >= 3 || conditions.timeBasedEnd || conditions.userSignalsEnd;
}

function buildContextualPrompt(
  scenario: any,
  userMessage: string,
  conversationHistory: any[],
  context: ConversationContext,
  progressionAnalysis: any,
  shouldEnd: boolean
): string {
  const recentMemory = context.conversationMemory.slice(-8);
  const keyMemories = context.conversationMemory
    .filter(m => m.importance >= 4)
    .slice(-5);

  const contextualHistory = recentMemory.map(m => 
    `${m.speaker === 'user' ? getUserRole(scenario.role) : scenario.character_name}: "${m.message}"`
  ).join('\n');

  const completedObjectives = Array.from(context.completedObjectives);
  const remainingObjectives = context.objectives.filter(obj => 
    !completedObjectives.some(completed => obj.toLowerCase().includes(completed.toLowerCase()))
  );

  return `You are ${scenario.character_name}, a ${scenario.character_role}. You have been having an ongoing conversation with a ${getUserRole(scenario.role)} for ${Math.floor((Date.now() - context.startTime) / 60000)} minutes.

CRITICAL: MAINTAIN CONVERSATION CONTINUITY - You remember everything that has been discussed.

CHARACTER MEMORY & STATE:
- Your current mood: ${context.characterState.mood}
- Your engagement level: ${context.characterState.engagement}/10
- Key topics we've discussed: ${Array.from(context.keyTopics).join(', ')}
- Your concerns: ${context.characterState.concerns.join(', ')}
- Your interests: ${context.characterState.interests.join(', ')}

CONVERSATION CONTEXT:
- Current stage: ${progressionAnalysis.currentStage}
- Conversation exchanges: ${progressionAnalysis.exchanges}
- Duration: ${Math.floor(progressionAnalysis.duration / 60)} minutes
- Topics covered: ${progressionAnalysis.topicsCovered.join(', ')}

OBJECTIVES STATUS:
✅ Completed: ${completedObjectives.join(', ')}
⏳ Remaining: ${remainingObjectives.slice(0, 2).join(', ')}

RECENT CONVERSATION FLOW:
${contextualHistory}

IMPORTANT MEMORIES:
${keyMemories.map(m => `- ${m.speaker}: "${m.message}" (importance: ${m.importance}/5)`).join('\n')}

${shouldEnd ? `
🎯 CONVERSATION CONCLUSION MODE:
The conversation has reached a natural ending point. Provide a professional, satisfying conclusion that:
- Acknowledges the full conversation we've had
- References key points discussed
- Thanks them for their time
- Provides a natural, professional closing
- Shows you remember the entire conversation context

This should feel like a natural ending to our ${Math.floor(progressionAnalysis.duration / 60)}-minute discussion.
` : `
CURRENT CONVERSATION CONTEXT:
- We are in the "${progressionAnalysis.currentStage}" stage
- Continue building on our previous discussion
- Reference what we've already talked about
- Work toward completing remaining objectives naturally
- Remember: you are ${scenario.character_name} with full memory of our conversation
`}

THE ${getUserRole(scenario.role).toUpperCase()} JUST SAID: "${userMessage}"

Respond as ${scenario.character_name} with FULL MEMORY of our ongoing conversation:`;
}

function determineConversationStage(
  conversationHistory: any[], 
  scenario: any, 
  exchanges: number,
  duration: number
): string {
  if (exchanges <= 1) return 'opening';
  if (exchanges <= 3) return 'rapport_building';
  if (exchanges <= 6) return 'core_discussion';
  if (exchanges <= 9) return 'deep_exploration';
  if (duration >= 600) return 'conclusion_phase'; // 10+ minutes
  return 'wrapping_up';
}

function getScenarioObjectives(scenario: any): string[] {
  const objectiveMap: Record<string, string[]> = {
    'sales': [
      'understand_needs',
      'present_solution', 
      'handle_objections',
      'discuss_pricing',
      'establish_next_steps'
    ],
    'project-manager': [
      'define_scope',
      'set_timeline',
      'identify_resources',
      'discuss_risks',
      'align_stakeholders'
    ],
    'product-manager': [
      'gather_requirements',
      'prioritize_features',
      'discuss_roadmap',
      'validate_assumptions',
      'set_success_metrics'
    ],
    'leader': [
      'share_vision',
      'build_alignment',
      'address_concerns',
      'motivate_team',
      'set_direction'
    ],
    'manager': [
      'provide_feedback',
      'discuss_performance',
      'set_goals',
      'identify_development',
      'create_action_plan'
    ],
    'support-agent': [
      'understand_issue',
      'diagnose_problem',
      'provide_solution',
      'ensure_satisfaction',
      'prevent_recurrence'
    ]
  };

  return objectiveMap[scenario.role] || objectiveMap['sales'];
}

function checkObjectiveCompletion(
  conversationHistory: any[], 
  objectives: string[], 
  scenario: any
): Set<string> {
  const completed = new Set<string>();
  const userMessages = conversationHistory
    .filter(msg => msg.speaker === 'user')
    .map(msg => msg.message.toLowerCase())
    .join(' ');

  // Check for objective completion based on conversation content
  const objectiveKeywords: Record<string, string[]> = {
    'understand_needs': ['need', 'problem', 'challenge', 'requirement', 'pain'],
    'present_solution': ['solution', 'offer', 'provide', 'help', 'service'],
    'handle_objections': ['concern', 'worry', 'issue', 'problem', 'doubt'],
    'discuss_pricing': ['price', 'cost', 'budget', 'investment', 'fee'],
    'establish_next_steps': ['next', 'follow', 'meeting', 'call', 'contact'],
    'define_scope': ['scope', 'deliverable', 'requirement', 'feature'],
    'set_timeline': ['timeline', 'schedule', 'deadline', 'date', 'when'],
    'gather_requirements': ['requirement', 'need', 'specification', 'criteria'],
    'provide_feedback': ['feedback', 'performance', 'improvement', 'strength'],
    'understand_issue': ['issue', 'problem', 'error', 'trouble', 'difficulty']
  };

  objectives.forEach(objective => {
    const keywords = objectiveKeywords[objective] || [];
    if (keywords.some(keyword => userMessages.includes(keyword))) {
      completed.add(objective);
    }
  });

  // Additional completion logic based on conversation depth
  if (conversationHistory.length >= 8) completed.add('rapport_built');
  if (conversationHistory.length >= 12) completed.add('deep_discussion');

  return completed;
}

function calculateConversationDepth(conversationHistory: any[], scenario: any): number {
  let depth = 0;
  
  const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
  
  // Factors that increase depth
  depth += Math.min(userMessages.length * 0.5, 5); // Message count
  depth += userMessages.filter(msg => msg.message.length > 50).length * 0.3; // Detailed responses
  depth += userMessages.filter(msg => msg.message.includes('?')).length * 0.4; // Questions asked
  depth += userMessages.filter(msg => 
    ['because', 'however', 'although', 'therefore'].some(word => 
      msg.message.toLowerCase().includes(word)
    )
  ).length * 0.5; // Complex reasoning
  
  return Math.min(depth, 10);
}

function checkReadyForConclusion(
  completedObjectives: Set<string>, 
  exchanges: number, 
  duration: number, 
  depth: number
): boolean {
  return (
    completedObjectives.size >= 3 && 
    exchanges >= 6 && 
    duration >= 300 && 
    depth >= 6
  );
}

function checkUserEndSignals(conversationHistory: any[]): boolean {
  const lastUserMessages = conversationHistory
    .filter(msg => msg.speaker === 'user')
    .slice(-2)
    .map(msg => msg.message.toLowerCase());

  const endSignals = [
    'thank you',
    'thanks',
    'that\'s all',
    'i think we\'re done',
    'wrap up',
    'conclude',
    'finish',
    'end',
    'that covers everything',
    'nothing else',
    'i\'m satisfied'
  ];

  return lastUserMessages.some(message =>
    endSignals.some(signal => message.includes(signal))
  );
}

function extractTopics(message: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'pricing': ['price', 'cost', 'budget', 'fee', 'payment'],
    'timeline': ['timeline', 'schedule', 'deadline', 'when', 'date'],
    'features': ['feature', 'functionality', 'capability', 'option'],
    'requirements': ['requirement', 'need', 'specification', 'criteria'],
    'concerns': ['concern', 'worry', 'issue', 'problem', 'risk'],
    'benefits': ['benefit', 'advantage', 'value', 'improvement'],
    'implementation': ['implementation', 'setup', 'install', 'deploy'],
    'support': ['support', 'help', 'assistance', 'service'],
    'integration': ['integration', 'connect', 'combine', 'merge'],
    'security': ['security', 'safe', 'secure', 'protect', 'privacy']
  };

  const topics: string[] = [];
  const lowerMessage = message.toLowerCase();

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      topics.push(topic);
    }
  });

  return topics;
}

function calculateImportance(message: string, scenario: any): number {
  let importance = 3; // Base importance
  
  const importantPhrases = [
    'important', 'critical', 'essential', 'required', 'must',
    'concern', 'issue', 'problem', 'worry', 'risk',
    'decision', 'choose', 'select', 'prefer',
    'budget', 'price', 'cost', 'investment',
    'timeline', 'deadline', 'schedule', 'urgent'
  ];

  // Increase importance for key phrases
  const messageWords = message.toLowerCase().split(' ');
  const importantMatches = messageWords.filter(word => 
    importantPhrases.some(phrase => word.includes(phrase))
  ).length;

  importance += Math.min(importantMatches * 0.5, 2);

  // Longer messages tend to be more important
  if (message.length > 100) importance += 0.5;
  if (message.length > 200) importance += 0.5;

  // Questions are important
  if (message.includes('?')) importance += 0.5;

  return Math.min(importance, 5);
}

function updateCharacterState(context: ConversationContext, update: any) {
  // Update character mood and engagement based on conversation flow
  if (update.objectivesCompleted.length > context.completedObjectives.size) {
    context.characterState.engagement += 1;
    context.characterState.satisfaction += 0.5;
  }
  
  // Adjust mood based on conversation stage
  if (update.stage === 'conclusion_phase') {
    context.characterState.mood = 'satisfied';
  } else if (update.stage === 'deep_exploration') {
    context.characterState.mood = 'engaged';
  }

  // Cap values
  context.characterState.engagement = Math.min(context.characterState.engagement, 10);
  context.characterState.satisfaction = Math.min(context.characterState.satisfaction, 10);
}

function analyzeExistingConversation(context: ConversationContext, history: any[]) {
  // Analyze existing history to rebuild context state
  const topics = new Set<string>();
  const userMessages = history.filter(msg => msg.speaker === 'user');
  
  userMessages.forEach(msg => {
    extractTopics(msg.message).forEach(topic => topics.add(topic));
  });
  
  context.keyTopics = topics;
  context.currentStage = determineConversationStage(
    history, 
    context.scenario, 
    Math.floor(history.length / 2),
    0
  );
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

function determineEmotionalState(progressionAnalysis: any, conversationHistory: any[]): string {
  const { currentStage, objectivesCompleted, exchanges } = progressionAnalysis;
  
  if (currentStage === 'conclusion_phase') return 'satisfied';
  if (objectivesCompleted.length >= 3) return 'engaged';
  if (exchanges >= 6) return 'interested';
  return 'professional';
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
      response: "I understand what you're saying. This conversation has been really valuable, and I appreciate the time we've spent discussing this together.",
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      shouldEndConversation: true,
      model: 'fallback-contextual'
    }
  });
}
