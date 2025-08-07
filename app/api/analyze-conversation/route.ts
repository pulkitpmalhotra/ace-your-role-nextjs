// app/api/analyze-conversation/route.ts - Context-Aware Analysis (TypeScript Fixed)
export async function POST(request: Request) {
  // Initialize variables with default values to avoid "used before assigned" errors
  let conversation: any[] = [];
  let scenario: any = { role: 'unknown', character_name: 'Character', title: 'Practice Session' };
  let sessionId: string = '';
  let sessionData: any = {};
  
  try {
    const requestData = await request.json();
    conversation = requestData.conversation || [];
    scenario = requestData.scenario || { role: 'unknown', character_name: 'Character', title: 'Practice Session' };
    sessionId = requestData.sessionId || '';
    sessionData = requestData.sessionData || {}; // Additional context
    
    if (!requestData.conversation || !requestData.scenario) {
      return Response.json(
        { success: false, error: 'Conversation and scenario are required' },
        { status: 400 }
      );
    }

    if (conversation.length < 2) {
      return Response.json(
        { success: false, error: 'Not enough conversation data to analyze' },
        { status: 400 }
      );
    }

    console.log('🧠 Enhanced USER PERFORMANCE analysis:', {
      sessionId,
      messageCount: conversation.length,
      role: scenario.role,
      duration: sessionData?.duration || 0
    });

    // Analyze conversation context and progression
    const conversationAnalysis = analyzeConversationContext(conversation, scenario, sessionData);
    
    // Perform enhanced AI analysis with full context
    let analysisResult: any;
    
    try {
      analysisResult = await performEnhancedAIAnalysis(
        conversation, 
        scenario, 
        sessionId, 
        conversationAnalysis
      );
      console.log('✅ Enhanced context-aware analysis completed');
    } catch (aiError) {
      console.warn('⚠️ AI analysis failed, using enhanced fallback:', aiError);
      analysisResult = performEnhancedFallback(conversation, scenario, conversationAnalysis);
    }

    return Response.json({
      success: true,
      data: {
        ...analysisResult,
        contextAnalysis: conversationAnalysis,
        analysisMetadata: {
          hasNaturalEnding: conversationAnalysis.hasNaturalEnding,
          conversationCompleteness: conversationAnalysis.completenessScore,
          objectivesCovered: conversationAnalysis.objectivesCovered,
          conversationFlow: conversationAnalysis.flowAnalysis
        }
      }
    });

  } catch (error) {
    console.error('💥 Enhanced Analysis API error:', error);
    
    // Now these variables are safely initialized with default values
    const fallbackResult = createEnhancedFallback(conversation, scenario);
    
    return Response.json({
      success: true,
      data: fallbackResult
    });
  }
}

// Enhanced conversation context analysis
function analyzeConversationContext(conversation: any[], scenario: any, sessionData: any) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const aiMessages = conversation.filter(msg => msg.speaker === 'ai');
  const exchanges = Math.floor(conversation.length / 2);
  
  // Analyze conversation progression and natural flow
  const progressionAnalysis = analyzeProgressionQuality(conversation, scenario);
  
  // Check for natural conversation ending
  const hasNaturalEnding = checkForNaturalEnding(conversation, scenario);
  
  // Analyze objective completion
  const objectiveAnalysis = analyzeObjectiveCompletion(userMessages, scenario);
  
  // Conversation flow analysis
  const flowAnalysis = analyzeConversationFlow(conversation, scenario);
  
  // Calculate completeness score
  const completenessScore = calculateCompletenessScore(
    exchanges,
    sessionData?.duration || 0,
    objectiveAnalysis.completionRate,
    progressionAnalysis.depth,
    hasNaturalEnding
  );

  return {
    messageCount: conversation.length,
    exchanges,
    userMessageCount: userMessages.length,
    duration: sessionData?.duration || Math.floor((Date.now() - (sessionData?.startTime || Date.now())) / 60000),
    
    // Progression analysis
    progressionStages: progressionAnalysis.stages,
    conversationDepth: progressionAnalysis.depth,
    topicalConsistency: progressionAnalysis.consistency,
    
    // Objective analysis
    objectivesCovered: objectiveAnalysis.covered,
    objectiveCompletionRate: objectiveAnalysis.completionRate,
    keyTopicsDiscussed: objectiveAnalysis.topics,
    
    // Flow analysis  
    flowAnalysis: {
      naturalProgression: flowAnalysis.naturalProgression,
      conversationCohesion: flowAnalysis.cohesion,
      engagementLevel: flowAnalysis.engagement,
      professionalismScore: flowAnalysis.professionalism
    },
    
    // Ending analysis
    hasNaturalEnding,
    endingQuality: hasNaturalEnding ? 'natural' : 'abrupt',
    
    // Overall assessment
    completenessScore,
    conversationQuality: calculateConversationQuality(progressionAnalysis, flowAnalysis, objectiveAnalysis),
    
    // Context for feedback generation
    userRole: getUserRoleFromScenario(scenario),
    characterRole: scenario.character_role,
    scenarioComplexity: getScenarioComplexity(scenario),
    
    // Performance indicators
    performanceIndicators: {
      conversationManagement: calculateConversationManagement(flowAnalysis, progressionAnalysis),
      goalAchievement: objectiveAnalysis.completionRate,
      communicationSkills: calculateCommunicationSkills(userMessages, flowAnalysis),
      professionalism: flowAnalysis.professionalism
    }
  };
}

// Analyze how well the conversation progressed through natural stages
function analyzeProgressionQuality(conversation: any[], scenario: any) {
  const stages: string[] = ['opening', 'rapport_building', 'core_discussion', 'deep_exploration', 'conclusion'];
  const stagesReached: string[] = [];
  const exchanges = Math.floor(conversation.length / 2);
  
  // Determine which stages were reached based on content and flow
  if (exchanges >= 1) stagesReached.push('opening');
  if (exchanges >= 2) stagesReached.push('rapport_building');
  if (exchanges >= 4) stagesReached.push('core_discussion');
  if (exchanges >= 6) stagesReached.push('deep_exploration');
  
  // Check for conclusion stage based on content
  const lastMessages = conversation.slice(-4);
  const hasConclusion = lastMessages.some(msg => 
    msg.speaker === 'ai' && (
      msg.message.toLowerCase().includes('thank') ||
      msg.message.toLowerCase().includes('wrap') ||
      msg.message.toLowerCase().includes('conclude') ||
      msg.message.toLowerCase().includes('appreciate') ||
      msg.message.toLowerCase().includes('been great') ||
      msg.message.toLowerCase().includes('good discussion')
    )
  );
  
  if (hasConclusion) stagesReached.push('conclusion');
  
  // Calculate depth based on user message complexity and engagement
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  const questionsAsked = userMessages.filter(msg => msg.message.includes('?')).length;
  const detailedResponses = userMessages.filter(msg => msg.message.length > 50).length;
  
  const depth = Math.min(
    (stagesReached.length * 2) + 
    (avgMessageLength > 30 ? 1 : 0) + 
    (questionsAsked > 2 ? 1 : 0) + 
    (detailedResponses > 3 ? 1 : 0),
    10
  );
  
  // Calculate consistency (how well the conversation stayed on topic)
  const topics = extractConversationTopics(conversation, scenario);
  const consistency = Math.min(topics.length > 3 ? 8 : topics.length * 2, 10);
  
  return {
    stages: stagesReached,
    stageCount: stagesReached.length,
    depth,
    consistency,
    naturalProgression: stagesReached.length >= 4
  };
}

// Check if conversation ended naturally vs abruptly
function checkForNaturalEnding(conversation: any[], scenario: any): boolean {
  if (conversation.length < 6) return false; // Too short for natural ending
  
  const lastFewMessages = conversation.slice(-4);
  const lastAiMessage = [...conversation].reverse().find(msg => msg.speaker === 'ai');
  const lastUserMessage = [...conversation].reverse().find(msg => msg.speaker === 'user');
  
  if (!lastAiMessage || !lastUserMessage) return false;
  
  // Check for conclusion indicators in AI's last message
  const conclusionKeywords = [
    'thank you', 'thanks', 'appreciate', 'been great', 'good discussion',
    'wrap up', 'conclude', 'summary', 'great talking', 'pleasure',
    'hope this helps', 'best of luck', 'looking forward', 'follow up'
  ];
  
  const aiEndsNaturally = conclusionKeywords.some(keyword =>
    lastAiMessage.message.toLowerCase().includes(keyword)
  );
  
  // Check for user ending signals
  const userEndingKeywords = [
    'thank you', 'thanks', 'that\'s all', 'think we\'re done', 'covers everything',
    'satisfied', 'helpful', 'answered my questions', 'good to go'
  ];
  
  const userSignaledEnd = userEndingKeywords.some(keyword =>
    lastUserMessage.message.toLowerCase().includes(keyword)
  );
  
  // Check conversation length and depth
  const exchanges = Math.floor(conversation.length / 2);
  const hasSubstance = exchanges >= 5;
  
  return (aiEndsNaturally || userSignaledEnd) && hasSubstance;
}

// FIXED: Analyze how well the user covered scenario objectives with explicit typing
function analyzeObjectiveCompletion(userMessages: any[], scenario: any) {
  const objectives = getScenarioObjectives(scenario.role);
  const coveredObjectives: string[] = []; // FIXED: Explicit string array type
  const topics = new Set<string>();
  
  const userText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
  
  // Define objective detection patterns
  const objectivePatterns: Record<string, { keywords: string[], weight: number }> = {
    'needs_assessment': { 
      keywords: ['need', 'problem', 'challenge', 'issue', 'requirement', 'pain point'], 
      weight: 2 
    },
    'solution_presentation': { 
      keywords: ['solution', 'offer', 'provide', 'help', 'service', 'product'], 
      weight: 2 
    },
    'objection_handling': { 
      keywords: ['concern', 'worry', 'hesitation', 'doubt', 'question', 'but'], 
      weight: 1.5 
    },
    'relationship_building': { 
      keywords: ['understand', 'experience', 'background', 'tell me', 'about you'], 
      weight: 1 
    },
    'information_gathering': { 
      keywords: ['how', 'what', 'when', 'where', 'why', 'tell me more'], 
      weight: 1.5 
    },
    'technical_discussion': { 
      keywords: ['technical', 'specification', 'feature', 'functionality', 'integration'], 
      weight: 1.5 
    },
    'pricing_discussion': { 
      keywords: ['price', 'cost', 'budget', 'investment', 'fee', 'pricing'], 
      weight: 2 
    },
    'timeline_planning': { 
      keywords: ['timeline', 'schedule', 'when', 'deadline', 'timeframe'], 
      weight: 1.5 
    },
    'next_steps': { 
      keywords: ['next', 'follow up', 'meeting', 'call', 'contact', 'proceed'], 
      weight: 2 
    }
  };
  
  // Check which objectives were covered
  Object.entries(objectivePatterns).forEach(([objective, pattern]) => {
    const matches = pattern.keywords.filter(keyword => userText.includes(keyword)).length;
    if (matches > 0) {
      coveredObjectives.push(objective);
      pattern.keywords.forEach(keyword => {
        if (userText.includes(keyword)) topics.add(keyword);
      });
    }
  });
  
  const completionRate = Math.min(coveredObjectives.length / Math.max(objectives.length, 5), 1);
  
  return {
    covered: coveredObjectives,
    total: objectives.length,
    completionRate,
    topics: Array.from(topics),
    detailedCoverage: analyzeDetailedCoverage(userMessages, scenario)
  };
}

// Analyze conversation flow and coherence
function analyzeConversationFlow(conversation: any[], scenario: any) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const aiMessages = conversation.filter(msg => msg.speaker === 'ai');
  
  // Check for natural progression
  const naturalProgression = checkNaturalProgression(conversation);
  
  // Calculate cohesion (how well messages connect)
  const cohesion = calculateCohesion(conversation);
  
  // Engagement level (length, questions, detail)
  const engagement = calculateEngagement(userMessages);
  
  // Professionalism score
  const professionalism = calculateProfessionalism(userMessages, scenario);
  
  return {
    naturalProgression,
    cohesion,
    engagement,
    professionalism,
    conversationBalance: aiMessages.length / Math.max(userMessages.length, 1),
    responseQuality: calculateResponseQuality(userMessages)
  };
}

function checkNaturalProgression(conversation: any[]): number {
  let progressionScore = 5; // Base score
  
  // Check if conversation builds logically
  const topics = conversation.map(msg => extractTopics(msg.message)).flat();
  const uniqueTopics = Array.from(new Set(topics)); // FIXED: Use Array.from instead of spread operator
  
  // Good progression has topic development
  if (uniqueTopics.length >= 3) progressionScore += 2;
  if (uniqueTopics.length >= 5) progressionScore += 1;
  
  // Check for abrupt topic changes (bad for flow)
  let abruptChanges = 0;
  for (let i = 2; i < conversation.length; i++) {
    const currentTopics = extractTopics(conversation[i].message);
    const previousTopics = extractTopics(conversation[i-1].message);
    const beforeTopics = extractTopics(conversation[i-2].message);
    
    const hasConnection = currentTopics.some(topic => 
      previousTopics.includes(topic) || beforeTopics.includes(topic)
    );
    
    if (!hasConnection && currentTopics.length > 0) {
      abruptChanges++;
    }
  }
  
  progressionScore -= Math.min(abruptChanges, 3);
  
  return Math.max(1, Math.min(progressionScore, 10));
}

function calculateCohesion(conversation: any[]): number {
  let cohesionScore = 5;
  
  // Check for reference to previous messages
  let references = 0;
  const referenceWords = ['that', 'this', 'what you said', 'mentioned', 'discussed', 'earlier'];
  
  conversation.forEach((msg, index) => {
    if (index > 0) {
      const hasReference = referenceWords.some(word => 
        msg.message.toLowerCase().includes(word)
      );
      if (hasReference) references++;
    }
  });
  
  cohesionScore += Math.min(references * 0.5, 3);
  
  // Check for logical question-answer pairs
  let goodPairs = 0;
  for (let i = 0; i < conversation.length - 1; i++) {
    if (conversation[i].speaker === 'user' && 
        conversation[i].message.includes('?') &&
        conversation[i + 1].speaker === 'ai') {
      goodPairs++;
    }
  }
  
  cohesionScore += Math.min(goodPairs * 0.3, 2);
  
  return Math.min(cohesionScore, 10);
}

function calculateEngagement(userMessages: any[]): number {
  let engagementScore = 0;
  
  // Message length indicates engagement
  const avgLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  if (avgLength > 30) engagementScore += 2;
  if (avgLength > 60) engagementScore += 1;
  
  // Questions indicate engagement
  const questionsAsked = userMessages.filter(msg => msg.message.includes('?')).length;
  engagementScore += Math.min(questionsAsked * 0.5, 3);
  
  // Detailed responses indicate engagement
  const detailedResponses = userMessages.filter(msg => msg.message.length > 50).length;
  engagementScore += Math.min(detailedResponses * 0.3, 2);
  
  // Follow-up questions/comments indicate engagement
  const followUps = userMessages.filter(msg => 
    msg.message.toLowerCase().includes('also') ||
    msg.message.toLowerCase().includes('additionally') ||
    msg.message.toLowerCase().includes('furthermore')
  ).length;
  engagementScore += Math.min(followUps * 0.5, 2);
  
  return Math.min(engagementScore, 10);
}

function calculateProfessionalism(userMessages: any[], scenario: any): number {
  let professionalismScore = 8; // Start high, deduct for issues
  
  const allText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
  
  // Professional language patterns
  const professionalPhrases = [
    'thank you', 'please', 'i appreciate', 'could you', 'would you',
    'i understand', 'that makes sense', 'good point', 'i see'
  ];
  
  const professionalCount = professionalPhrases.filter(phrase => 
    allText.includes(phrase)
  ).length;
  
  if (professionalCount >= 2) professionalismScore += 1;
  if (professionalCount >= 4) professionalismScore += 1;
  
  // Check for unprofessional elements (rare but possible)
  const unprofessionalPatterns = [
    'yeah', 'yep', 'nope', 'gonna', 'wanna', 'dunno'
  ];
  
  const unprofessionalCount = unprofessionalPatterns.filter(pattern =>
    allText.includes(pattern)
  ).length;
  
  professionalismScore -= unprofessionalCount * 0.5;
  
  return Math.max(1, Math.min(professionalismScore, 10));
}

function calculateResponseQuality(userMessages: any[]): number {
  let qualityScore = 0;
  
  // Check for thoughtful responses (questions, explanations, examples)
  userMessages.forEach(msg => {
    const message = msg.message.toLowerCase();
    
    // Questions show engagement
    if (message.includes('?')) qualityScore += 0.5;
    
    // Examples show depth
    if (message.includes('example') || message.includes('instance')) qualityScore += 0.3;
    
    // Explanations show understanding
    if (message.includes('because') || message.includes('since')) qualityScore += 0.3;
    
    // Comparative thinking
    if (message.includes('compared to') || message.includes('versus')) qualityScore += 0.3;
  });
  
  return Math.min(qualityScore, 10);
}

// Calculate overall completeness score
function calculateCompletenessScore(
  exchanges: number,
  duration: number,
  objectiveCompletionRate: number,
  conversationDepth: number,
  hasNaturalEnding: boolean
): number {
  let score = 0;
  
  // Exchange depth (0-3 points)
  if (exchanges >= 8) score += 3;
  else if (exchanges >= 6) score += 2;
  else if (exchanges >= 4) score += 1;
  
  // Duration points (0-2 points)
  if (duration >= 600) score += 2; // 10+ minutes
  else if (duration >= 300) score += 1; // 5+ minutes
  
  // Objective completion (0-3 points)
  score += objectiveCompletionRate * 3;
  
  // Conversation depth (0-2 points)
  if (conversationDepth >= 8) score += 2;
  else if (conversationDepth >= 6) score += 1;
  
  // Natural ending bonus (0-1 points)
  if (hasNaturalEnding) score += 1;
  
  return Math.min(score, 10);
}

function calculateConversationQuality(progressionAnalysis: any, flowAnalysis: any, objectiveAnalysis: any): number {
  const weights = {
    progression: 0.3,
    flow: 0.3,
    objectives: 0.4
  };
  
  const progressionScore = (progressionAnalysis.depth + progressionAnalysis.consistency) / 2;
  const flowScore = (flowAnalysis.naturalProgression + flowAnalysis.cohesion + flowAnalysis.engagement) / 3;
  const objectiveScore = objectiveAnalysis.completionRate * 10;
  
  return (
    progressionScore * weights.progression +
    flowScore * weights.flow +
    objectiveScore * weights.objectives
  );
}

// Enhanced AI analysis with full context
async function performEnhancedAIAnalysis(
  conversation: any[], 
  scenario: any, 
  sessionId: string, 
  contextAnalysis: any
) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const analysisPrompt = buildEnhancedAnalysisPrompt(conversation, scenario, contextAnalysis);
  
  console.log('🤖 Calling Gemini for enhanced USER analysis...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1500,
          candidateCount: 1,
        }
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiAnalysis) {
    throw new Error('No analysis content from Gemini');
  }

  const parsedAnalysis = parseEnhancedAnalysis(aiAnalysis, conversation, scenario, contextAnalysis);
  
  return {
    ...parsedAnalysis,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    analysis_type: 'enhanced-contextual-analysis',
    context_metadata: {
      conversation_completeness: contextAnalysis.completenessScore,
      natural_ending: contextAnalysis.hasNaturalEnding,
      objective_coverage: contextAnalysis.objectiveCompletionRate,
      conversation_quality: contextAnalysis.conversationQuality
    }
  };
}

function buildEnhancedAnalysisPrompt(conversation: any[], scenario: any, contextAnalysis: any): string {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRoleFromScenario(scenario.role);
  
  const conversationText = conversation.map((msg, i) => 
    `${msg.speaker === 'user' ? `USER (${userRole})` : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  return `You are an expert ${scenario.role.replace('-', ' ')} communication coach analyzing a completed practice session.

IMPORTANT: Analyze ONLY the USER's performance as a ${userRole}. Ignore the AI character's responses.

CONTEXT ANALYSIS RESULTS:
- Conversation Completeness: ${contextAnalysis.completenessScore}/10
- Natural Ending: ${contextAnalysis.hasNaturalEnding ? 'Yes' : 'No'}
- Objective Coverage: ${Math.round(contextAnalysis.objectiveCompletionRate * 100)}%
- Conversation Quality: ${contextAnalysis.conversationQuality.toFixed(1)}/10
- Stages Reached: ${contextAnalysis.progressionStages.join(', ')}
- Topics Covered: ${contextAnalysis.keyTopicsDiscussed.join(', ')}

SESSION DETAILS:
- Practice Scenario: "${scenario.title}"
- User Role: ${userRole}
- Character: ${scenario.character_name} (${scenario.character_role})
- Duration: ${contextAnalysis.duration} minutes
- Exchanges: ${contextAnalysis.exchanges}

PERFORMANCE INDICATORS:
- Conversation Management: ${contextAnalysis.performanceIndicators.conversationManagement.toFixed(1)}/10
- Goal Achievement: ${Math.round(contextAnalysis.performanceIndicators.goalAchievement * 100)}%
- Communication Skills: ${contextAnalysis.performanceIndicators.communicationSkills.toFixed(1)}/10
- Professionalism: ${contextAnalysis.performanceIndicators.professionalism.toFixed(1)}/10

COMPLETE CONVERSATION TRANSCRIPT:
${conversationText}

USER MESSAGES ONLY (Focus your analysis on these):
${userMessages.map((msg, i) => `${i+1}. "${msg.message}"`).join('\n')}

Based on this complete context, provide comprehensive feedback in this EXACT format:

OVERALL_IMPRESSION: [2-3 sentences about the USER's overall performance as a ${userRole}, acknowledging the ${contextAnalysis.hasNaturalEnding ? 'complete conversation with natural ending' : 'conversation that was cut short'}]

WHAT_WORKED_WELL: [List 3-4 specific things the USER did well, referencing actual conversation content]

AREAS_TO_IMPROVE: [List 3-4 specific areas for improvement, considering the conversation context and completeness]

COACHING_ADVICE: [Detailed advice for improving ${userRole} skills, considering both strengths and weaknesses observed]

SCORE: [Rate 1-5 based on: conversation management (${contextAnalysis.performanceIndicators.conversationManagement.toFixed(1)}/10), goal achievement (${Math.round(contextAnalysis.performanceIndicators.goalAchievement * 100)}%), communication skills (${contextAnalysis.performanceIndicators.communicationSkills.toFixed(1)}/10), and professionalism (${contextAnalysis.performanceIndicators.professionalism.toFixed(1)}/10)]

Focus exclusively on the USER's ${userRole} performance in this ${contextAnalysis.hasNaturalEnding ? 'complete' : 'incomplete'} conversation.`;
}

// Helper functions
function getUserRoleFromScenario(role: string): string {
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

function getScenarioObjectives(role: string): string[] {
  const objectiveMap: Record<string, string[]> = {
    'sales': ['needs_assessment', 'solution_presentation', 'objection_handling', 'pricing_discussion', 'next_steps'],
    'project-manager': ['scope_definition', 'timeline_planning', 'resource_allocation', 'risk_management', 'stakeholder_alignment'],
    'product-manager': ['requirements_gathering', 'feature_prioritization', 'roadmap_discussion', 'user_validation', 'success_metrics'],
    'leader': ['vision_communication', 'team_alignment', 'strategic_direction', 'motivation', 'change_management'],
    'manager': ['performance_feedback', 'goal_setting', 'development_planning', 'coaching', 'relationship_building'],
    'support-agent': ['issue_understanding', 'problem_diagnosis', 'solution_provision', 'satisfaction_confirmation', 'follow_up']
  };
  
  return objectiveMap[role] || objectiveMap['sales'];
}

function getScenarioComplexity(scenario: any): 'basic' | 'intermediate' | 'advanced' {
  if (scenario.difficulty === 'beginner') return 'basic';
  if (scenario.difficulty === 'advanced') return 'advanced';
  return 'intermediate';
}

function extractTopics(message: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'pricing': ['price', 'cost', 'budget', 'fee', 'payment', 'expensive', 'affordable'],
    'timeline': ['timeline', 'schedule', 'deadline', 'when', 'date', 'time', 'duration'],
    'features': ['feature', 'functionality', 'capability', 'option', 'benefit'],
    'requirements': ['requirement', 'need', 'specification', 'criteria', 'must have'],
    'concerns': ['concern', 'worry', 'issue', 'problem', 'risk', 'challenge'],
    'implementation': ['implementation', 'setup', 'install', 'deploy', 'rollout'],
    'support': ['support', 'help', 'assistance', 'service', 'maintenance'],
    'integration': ['integration', 'connect', 'combine', 'merge', 'compatibility']
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

function extractConversationTopics(conversation: any[], scenario: any): string[] {
  const allTopics = conversation
    .map(msg => extractTopics(msg.message))
    .flat();
  
  return Array.from(new Set(allTopics)); // FIXED: Use Array.from instead of spread operator
}

function analyzeDetailedCoverage(userMessages: any[], scenario: any): Record<string, number> {
  const coverage: Record<string, number> = {};
  const userText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
  
  const detailedPatterns: Record<string, string[]> = {
    'questioning_skills': ['what', 'how', 'why', 'when', 'where', 'tell me', 'explain'],
    'active_listening': ['i understand', 'i see', 'that makes sense', 'interesting', 'tell me more'],
    'relationship_building': ['about you', 'experience', 'background', 'team', 'company'],
    'problem_solving': ['solution', 'solve', 'address', 'resolve', 'fix', 'help'],
    'technical_depth': ['technical', 'specification', 'details', 'how it works', 'integration']
  };
  
  Object.entries(detailedPatterns).forEach(([skill, patterns]) => {
    const matches = patterns.filter(pattern => userText.includes(pattern)).length;
    coverage[skill] = Math.min(matches / patterns.length, 1);
  });
  
  return coverage;
}

function calculateConversationManagement(flowAnalysis: any, progressionAnalysis: any): number {
  return (
    flowAnalysis.naturalProgression * 0.4 +
    flowAnalysis.cohesion * 0.3 +
    progressionAnalysis.depth * 0.3
  );
}

function calculateCommunicationSkills(userMessages: any[], flowAnalysis: any): number {
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  const questionsAsked = userMessages.filter(msg => msg.message.includes('?')).length;
  
  let skillsScore = 5; // Base score
  
  // Message quality
  if (avgMessageLength > 40) skillsScore += 1;
  if (avgMessageLength > 80) skillsScore += 1;
  
  // Questioning skills
  skillsScore += Math.min(questionsAsked * 0.5, 2);
  
  // Engagement and professionalism
  skillsScore += (flowAnalysis.engagement * 0.2);
  skillsScore += (flowAnalysis.professionalism * 0.3);
  
  return Math.min(skillsScore, 10);
}

// Parse enhanced analysis response
function parseEnhancedAnalysis(aiResponse: string, conversation: any[], scenario: any, contextAnalysis: any) {
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  let overall_impression = '';
  let what_worked_well: string[] = [];
  let areas_to_improve: string[] = [];
  let coaching_advice = '';
  let score = 3.0;
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('OVERALL_IMPRESSION:')) {
      overall_impression = trimmed.replace('OVERALL_IMPRESSION:', '').trim();
      currentSection = 'impression';
    } else if (trimmed.startsWith('WHAT_WORKED_WELL:')) {
      currentSection = 'strengths';
    } else if (trimmed.startsWith('AREAS_TO_IMPROVE:')) {
      currentSection = 'improvements';
    } else if (trimmed.startsWith('COACHING_ADVICE:')) {
      currentSection = 'advice';
    } else if (trimmed.startsWith('SCORE:')) {
      const scoreMatch = trimmed.match(/(\d+\.?\d*)/);
      if (scoreMatch) {
        score = Math.min(5.0, Math.max(1.0, parseFloat(scoreMatch[1])));
      }
      currentSection = '';
    } else if (trimmed && currentSection === 'impression' && !overall_impression) {
      overall_impression = trimmed;
    } else if (trimmed && currentSection === 'strengths') {
      const content = trimmed.replace(/^[-•*]\s*/, '').trim();
      if (content && content.length > 5) {
        what_worked_well.push(content);
      }
    } else if (trimmed && currentSection === 'improvements') {
      const content = trimmed.replace(/^[-•*]\s*/, '').trim();
      if (content && content.length > 5) {
        areas_to_improve.push(content);
      }
    } else if (trimmed && currentSection === 'advice') {
      if (!coaching_advice) {
        coaching_advice = trimmed;
      } else {
        coaching_advice += ' ' + trimmed;
      }
    }
  }

  const userRole = getUserRoleFromScenario(scenario.role);

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: overall_impression || `You completed a ${userRole} practice session with ${scenario.character_name}. ${contextAnalysis.hasNaturalEnding ? 'The conversation reached a natural conclusion' : 'The session covered key topics'} over ${contextAnalysis.exchanges} exchanges.`,
      what_worked_well: what_worked_well.length > 0 ? what_worked_well : [
        `You actively engaged as a ${userRole} throughout the conversation`,
        `You maintained professional communication during the ${contextAnalysis.duration}-minute session`,
        contextAnalysis.performanceIndicators.communicationSkills > 7 ? 'You demonstrated strong communication skills' : 'You participated consistently in the role-play exercise'
      ],
      areas_to_improve: areas_to_improve.length > 0 ? areas_to_improve : [
        contextAnalysis.objectiveCompletionRate < 0.5 ? `Focus on covering more ${userRole} objectives in future sessions` : `Continue developing your ${userRole} conversation techniques`,
        !contextAnalysis.hasNaturalEnding ? 'Practice bringing conversations to natural conclusions' : 'Try to explore topics in even greater depth',
        contextAnalysis.performanceIndicators.goalAchievement < 0.7 ? 'Work on achieving conversation goals more systematically' : 'Continue building on your professional communication approach'
      ],
      coaching_advice: coaching_advice || `Your ${userRole} practice session ${contextAnalysis.hasNaturalEnding ? 'was well-structured with a natural ending' : 'covered important ground'}. Focus on ${contextAnalysis.objectiveCompletionRate < 0.5 ? 'systematic objective completion' : 'deepening your professional conversations'} in future sessions.`
    },
    conversation_stats: {
      total_exchanges: contextAnalysis.exchanges,
      user_messages: contextAnalysis.userMessageCount,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: contextAnalysis.duration,
      conversation_quality: contextAnalysis.conversationQuality,
      completeness_score: contextAnalysis.completenessScore,
      natural_ending: contextAnalysis.hasNaturalEnding
    },
    enhanced_metrics: {
      progression_analysis: {
        stages_completed: contextAnalysis.progressionStages,
        conversation_depth: contextAnalysis.conversationDepth,
        topic_consistency: contextAnalysis.topicalConsistency
      },
      flow_analysis: contextAnalysis.flowAnalysis,
      objective_analysis: {
        completion_rate: contextAnalysis.objectiveCompletionRate,
        objectives_covered: contextAnalysis.objectivesCovered,
        topics_discussed: contextAnalysis.keyTopicsDiscussed
      },
      performance_breakdown: contextAnalysis.performanceIndicators
    }
  };
}

// Enhanced fallback with context awareness
function performEnhancedFallback(conversation: any[], scenario: any, contextAnalysis: any) {
  console.log('📊 Creating enhanced contextual fallback...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRoleFromScenario(scenario.role);
  
  // Calculate score based on context analysis
  let score = 2.5; // Base score
  
  // Context-based scoring
  score += contextAnalysis.completenessScore * 0.15; // Up to 1.5 points
  score += contextAnalysis.conversationQuality * 0.1; // Up to 1 point
  if (contextAnalysis.hasNaturalEnding) score += 0.5;
  if (contextAnalysis.exchanges >= 6) score += 0.3;
  if (contextAnalysis.objectiveCompletionRate > 0.5) score += 0.4;
  
  score = Math.min(5.0, score);

  // Context-aware feedback
  const contextualFeedback = generateContextualFeedback(contextAnalysis, scenario, userMessages);

  return {
    overall_score: score,
    human_feedback: contextualFeedback,
    conversation_stats: {
      total_exchanges: contextAnalysis.exchanges,
      user_messages: contextAnalysis.userMessageCount,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: contextAnalysis.duration,
      conversation_quality: contextAnalysis.conversationQuality,
      completeness_score: contextAnalysis.completenessScore,
      natural_ending: contextAnalysis.hasNaturalEnding
    },
    enhanced_metrics: {
      progression_analysis: {
        stages_completed: contextAnalysis.progressionStages,
        conversation_depth: contextAnalysis.conversationDepth,
        topic_consistency: contextAnalysis.topicalConsistency
      },
      flow_analysis: contextAnalysis.flowAnalysis,
      objective_analysis: {
        completion_rate: contextAnalysis.objectiveCompletionRate,
        objectives_covered: contextAnalysis.objectivesCovered,
        topics_discussed: contextAnalysis.keyTopicsDiscussed
      },
      performance_breakdown: contextAnalysis.performanceIndicators
    },
    session_id: 'fallback',
    timestamp: new Date().toISOString(),
    analysis_type: 'enhanced-contextual-fallback'
  };
}

function generateContextualFeedback(contextAnalysis: any, scenario: any, userMessages: any[]) {
  const userRole = getUserRoleFromScenario(scenario.role);
  
  // Overall impression based on context
  let impression = `You practiced as a ${userRole} with ${scenario.character_name} `;
  
  if (contextAnalysis.hasNaturalEnding) {
    impression += `and successfully brought the conversation to a natural conclusion after ${contextAnalysis.exchanges} meaningful exchanges`;
  } else {
    impression += `over ${contextAnalysis.exchanges} exchanges, covering ${Math.round(contextAnalysis.objectiveCompletionRate * 100)}% of the key ${userRole} objectives`;
  }
  
  impression += `. Your conversation quality scored ${contextAnalysis.conversationQuality.toFixed(1)}/10.`;

  // Strengths based on context
  const strengths = [];
  
  if (contextAnalysis.performanceIndicators.professionalism >= 8) {
    strengths.push('You maintained excellent professionalism throughout the conversation');
  } else if (contextAnalysis.performanceIndicators.professionalism >= 6) {
    strengths.push('You demonstrated good professional communication skills');
  } else {
    strengths.push(`You actively participated in the ${userRole} role-play exercise`);
  }
  
  if (contextAnalysis.flowAnalysis.engagement >= 7) {
    strengths.push('You showed strong engagement with thoughtful, detailed responses');
  } else if (contextAnalysis.exchanges >= 6) {
    strengths.push(`You sustained the conversation well with ${contextAnalysis.exchanges} exchanges`);
  } else {
    strengths.push('You participated actively in the practice scenario');
  }
  
  if (contextAnalysis.objectiveCompletionRate >= 0.7) {
    strengths.push(`You covered most of the important ${userRole} objectives effectively`);
  } else if (contextAnalysis.keyTopicsDiscussed.length >= 3) {
    strengths.push(`You discussed multiple relevant topics: ${contextAnalysis.keyTopicsDiscussed.slice(0, 3).join(', ')}`);
  } else {
    strengths.push('You stayed focused on the conversation scenario');
  }
  
  if (contextAnalysis.hasNaturalEnding) {
    strengths.push('You successfully guided the conversation to a natural, professional conclusion');
  }

  // Areas to improve based on context
  const improvements = [];
  
  if (!contextAnalysis.hasNaturalEnding) {
    improvements.push('Practice bringing conversations to natural, satisfying conclusions');
  } else if (contextAnalysis.exchanges < 6) {
    improvements.push(`Try to extend conversations longer for more comprehensive ${userRole} practice`);
  }
  
  if (contextAnalysis.objectiveCompletionRate < 0.5) {
    improvements.push(`Focus on covering more core ${userRole} objectives systematically`);
  } else if (contextAnalysis.conversationDepth < 6) {
    improvements.push('Try to explore topics in greater depth with more detailed questions');
  }
  
  if (contextAnalysis.performanceIndicators.communicationSkills < 7) {
    improvements.push('Work on asking more probing questions and providing more detailed responses');
  } else if (contextAnalysis.flowAnalysis.cohesion < 7) {
    improvements.push('Focus on building stronger connections between conversation topics');
  }
  
  if (contextAnalysis.performanceIndicators.goalAchievement < 0.6) {
    improvements.push(`Develop a more systematic approach to achieving ${userRole} conversation goals`);
  }

  // Coaching advice based on context
  let advice = `Your ${userRole} practice session `;
  
  if (contextAnalysis.completenessScore >= 8) {
    advice += 'was comprehensive and well-executed. Continue practicing with similar depth and focus on refining your advanced techniques.';
  } else if (contextAnalysis.completenessScore >= 6) {
    advice += 'showed good progress. Focus on extending conversations naturally and covering objectives more systematically.';
  } else if (contextAnalysis.completenessScore >= 4) {
    advice += 'covered the basics well. Work on deeper engagement, asking more questions, and bringing conversations to natural conclusions.';
  } else {
    advice += 'was a good start. Focus on longer conversations, covering more objectives, and building stronger professional rapport.';
  }
  
  if (contextAnalysis.hasNaturalEnding) {
    advice += ' Your ability to conclude conversations naturally is a strong skill to build upon.';
  }

  return {
    overall_impression: impression,
    what_worked_well: strengths.slice(0, 4), // Limit to top 4
    areas_to_improve: improvements.slice(0, 4), // Limit to top 4
    coaching_advice: advice
  };
}

// Enhanced minimal fallback for errors
function createEnhancedFallback(conversation: any[], scenario: any) {
  const exchanges = conversation && conversation.length ? Math.floor(conversation.length / 2) : 0;
  const userMessages = conversation ? conversation.filter(msg => msg.speaker === 'user').length : 0;
  const characterName = scenario?.character_name || 'Character';
  const scenarioTitle = scenario?.title || 'Practice Session';
  const roleType = scenario?.role || 'communication';
  const userRole = getUserRoleFromScenario(roleType);
  
  // Estimate basic context
  const hasSubstance = exchanges >= 3;
  const estimatedDuration = exchanges * 2; // Rough estimate
  
  return {
    overall_score: hasSubstance ? 3.2 : 2.8,
    human_feedback: {
      overall_impression: `You completed a ${userRole} practice session with ${characterName}${hasSubstance ? ', engaging in meaningful conversation' : ''}. Every practice session contributes to your professional development.`,
      what_worked_well: [
        `You took the initiative to practice your ${userRole} skills`,
        hasSubstance ? `You sustained ${exchanges} conversation exchanges` : 'You engaged with the AI character professionally',
        'You participated actively in the role-play scenario',
        hasSubstance ? 'You demonstrated commitment to skill development' : 'You completed the practice session'
      ].slice(0, 3),
      areas_to_improve: [
        hasSubstance ? `Try extending conversations longer for more comprehensive ${userRole} practice` : `Focus on longer conversations to practice more ${userRole} skills`,
        `Work on covering more core ${roleType.replace('-', ' ')} objectives systematically`,
        hasSubstance ? 'Practice bringing conversations to natural, professional conclusions' : 'Build confidence through regular practice sessions',
        'Continue developing your professional communication techniques'
      ].slice(0, 3),
      coaching_advice: `Keep practicing ${userRole} scenarios regularly to build confidence and improve your professional communication skills. ${hasSubstance ? 'Focus on extending conversations and achieving specific objectives.' : 'Try to engage more deeply in future sessions.'}`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: userMessages,
      character_name: characterName,
      scenario_title: scenarioTitle,
      role_type: roleType,
      user_role_practiced: userRole,
      session_duration: estimatedDuration,
      conversation_quality: hasSubstance ? 5.5 : 4.0,
      completeness_score: hasSubstance ? 4.0 : 2.5,
      natural_ending: false
    },
    enhanced_metrics: {
      progression_analysis: {
        stages_completed: hasSubstance ? ['opening', 'core_discussion'] : ['opening'],
        conversation_depth: hasSubstance ? 4 : 2,
        topic_consistency: hasSubstance ? 6 : 4
      },
      flow_analysis: {
        naturalProgression: hasSubstance ? 6 : 4,
        cohesion: hasSubstance ? 5 : 4,
        engagement: hasSubstance ? 6 : 4,
        professionalism: 7
      },
      objective_analysis: {
        completion_rate: hasSubstance ? 0.4 : 0.2,
        objectives_covered: hasSubstance ? ['relationship_building'] : [],
        topics_discussed: hasSubstance ? ['general'] : []
      },
      performance_breakdown: {
        conversationManagement: hasSubstance ? 5.0 : 3.0,
        goalAchievement: hasSubstance ? 0.4 : 0.2,
        communicationSkills: hasSubstance ? 5.5 : 4.0,
        professionalism: 7.0
      }
    },
    timestamp: new Date().toISOString(),
    analysis_type: 'enhanced-minimal-fallback'
  };
}
