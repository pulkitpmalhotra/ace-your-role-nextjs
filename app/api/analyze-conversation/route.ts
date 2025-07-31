// app/api/analyze-conversation/route.ts - AI-Powered Conversation Analysis (Fixed TypeScript)
export async function POST(request: Request) {
  try {
    const { conversation, scenario, session_id } = await request.json();
    
    if (!conversation || !scenario) {
      return Response.json(
        { success: false, error: 'Conversation and scenario are required' },
        { status: 400 }
      );
    }

    console.log('🧠 Analyzing conversation for session:', session_id);
    console.log('📊 Category:', scenario.category, 'Messages:', conversation.length);

    // Get AI analysis using Gemini
    const analysis = await analyzeConversationWithAI(conversation, scenario);
    
    // Calculate detailed scores
    const scores = calculateDetailedScores(conversation, scenario, analysis);
    
    // Generate coaching recommendations
    const coaching = generateCoachingRecommendations(analysis, scores, scenario);
    
    // Create comprehensive feedback
    const feedback = {
      session_id,
      overall_score: scores.overall,
      category_scores: scores.categories,
      conversation_analysis: analysis,
      coaching_insights: coaching,
      improvement_areas: identifyImprovementAreas(scores),
      strengths: identifyStrengths(scores, analysis),
      next_session_focus: generateNextSessionFocus(scores, scenario.category),
      skill_progression: calculateSkillProgression(scores),
      timestamp: new Date().toISOString()
    };

    console.log('✅ Conversation analysis completed. Overall score:', scores.overall);

    return Response.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('💥 Conversation analysis error:', error);
    return Response.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// AI-powered conversation analysis using Gemini
async function analyzeConversationWithAI(conversation: any[], scenario: any) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ No Gemini API key, using basic analysis');
    return generateBasicAnalysis(conversation, scenario);
  }

  // Build conversation context
  const conversationText = conversation.map((msg, index) => 
    `${index + 1}. ${msg.speaker === 'user' ? 'TRAINEE' : scenario.character_name}: ${msg.message}`
  ).join('\n');

  // Create analysis prompt based on category
  const analysisPrompt = buildAnalysisPrompt(scenario.category, conversationText, scenario);

  try {
    console.log('🤖 Calling Gemini for conversation analysis...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more analytical responses
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1000,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('❌ Gemini analysis failed, using basic analysis');
      return generateBasicAnalysis(conversation, scenario);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (analysisText) {
      return parseAIAnalysis(analysisText);
    } else {
      return generateBasicAnalysis(conversation, scenario);
    }

  } catch (error) {
    console.error('❌ AI analysis error:', error);
    return generateBasicAnalysis(conversation, scenario);
  }
}

// Build analysis prompt based on conversation category
function buildAnalysisPrompt(category: string, conversationText: string, scenario: any) {
  const categoryAnalysis = getCategoryAnalysisFramework(category);
  
  return `You are an expert ${category} communication coach. Analyze this roleplay conversation and provide detailed feedback.

SCENARIO CONTEXT:
- Category: ${category}
- Character: ${scenario.character_name} (${scenario.character_role})
- Scenario: ${scenario.title}

CONVERSATION TO ANALYZE:
${conversationText}

ANALYSIS FRAMEWORK FOR ${category.toUpperCase()}:
${categoryAnalysis}

Please analyze this conversation and provide scores (1-5) and detailed feedback for each area. Be specific about what the trainee did well and what they could improve.

Format your response as structured feedback covering:
1. Opening & Rapport (score and feedback)
2. ${getCategorySpecificAreas(category).join('\n3. ')}
4. Overall Communication Style
5. Key Strengths (2-3 specific examples)
6. Main Improvement Areas (2-3 specific suggestions)
7. Next Practice Focus

Be constructive, specific, and actionable in your feedback.`;
}

// Category-specific analysis frameworks
function getCategoryAnalysisFramework(category: string): string {
  const frameworks: Record<string, string> = {
    'sales': `
    1. Opening & Rapport - How well did they establish connection and credibility?
    2. Discovery & Needs Analysis - Did they ask good questions to understand pain points?
    3. Solution Presentation - How effectively did they present value and benefits?
    4. Objection Handling - Did they address concerns professionally and effectively?
    5. Closing & Next Steps - Were they clear about next actions and timeline?`,
    
    'healthcare': `
    1. Patient Communication - How well did they communicate with empathy and clarity?
    2. Information Gathering - Did they ask appropriate medical questions?
    3. Explanation & Education - How clearly did they explain conditions/treatments?
    4. Concern Addressing - Did they handle patient worries appropriately?
    5. Care Planning - Were next steps and follow-up clearly communicated?`,
    
    'support': `
    1. Issue Understanding - How well did they listen and understand the problem?
    2. Empathy & Rapport - Did they show appropriate empathy and understanding?
    3. Problem Solving - How effectively did they work toward resolution?
    4. Communication Clarity - Were explanations clear and easy to follow?
    5. Service Recovery - Did they ensure customer satisfaction and follow-up?`,
    
    'leadership': `
    1. Communication Style - How effectively did they communicate as a leader?
    2. Active Listening - Did they demonstrate good listening skills?
    3. Feedback Delivery - How well did they provide constructive feedback?
    4. Motivation & Support - Did they show appropriate support and encouragement?
    5. Goal Setting - Were expectations and next steps clearly established?`,
    
    'legal': `
    1. Professional Demeanor - Did they maintain appropriate professional standards?
    2. Information Gathering - How thoroughly did they understand the client's situation?
    3. Legal Explanation - How clearly did they explain legal concepts and options?
    4. Risk Communication - Did they appropriately communicate risks and outcomes?
    5. Client Relationship - How well did they build trust and manage expectations?`
  };
  
  return frameworks[category] || frameworks['sales'];
}

// Get category-specific skill areas
function getCategorySpecificAreas(category: string): string[] {
  const areas: Record<string, string[]> = {
    'sales': ['Discovery & Needs Analysis', 'Solution Presentation', 'Objection Handling', 'Closing & Next Steps'],
    'healthcare': ['Information Gathering', 'Explanation & Education', 'Concern Addressing', 'Care Planning'],
    'support': ['Issue Understanding', 'Problem Solving', 'Communication Clarity', 'Service Recovery'],
    'leadership': ['Active Listening', 'Feedback Delivery', 'Motivation & Support', 'Goal Setting'],
    'legal': ['Information Gathering', 'Legal Explanation', 'Risk Communication', 'Client Relationship']
  };
  
  return areas[category] || areas['sales'];
}

// Parse AI analysis response into structured format
function parseAIAnalysis(analysisText: string) {
  // Try to extract structured information from AI response
  // This is a simplified parser - in production you might want more sophisticated parsing
  
  const lines = analysisText.split('\n').filter(line => line.trim());
  const analysis: any = {
    opening_rapport: { score: 3, feedback: '' },
    category_specific: {},
    communication_style: { score: 3, feedback: '' },
    strengths: [],
    improvements: [],
    next_focus: ''
  };

  // Extract scores and feedback (simplified parsing)
  for (const line of lines) {
    if (line.includes('Opening') || line.includes('Rapport')) {
      const score = extractScore(line);
      if (score) analysis.opening_rapport.score = score;
      analysis.opening_rapport.feedback += line + ' ';
    }
    
    if (line.includes('Strength') || line.includes('strength')) {
      analysis.strengths.push(line.replace(/^\d+\.?\s*/, '').trim());
    }
    
    if (line.includes('Improve') || line.includes('improve')) {
      analysis.improvements.push(line.replace(/^\d+\.?\s*/, '').trim());
    }
    
    if (line.includes('Next') || line.includes('Focus')) {
      analysis.next_focus += line + ' ';
    }
  }

  return analysis;
}

// Extract numerical score from text
function extractScore(text: string): number | null {
  const scoreMatch = text.match(/(\d)\/5|(\d)\s*out\s*of\s*5|score.*?(\d)/i);
  if (scoreMatch) {
    return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
  }
  return null;
}

// Generate basic analysis fallback
function generateBasicAnalysis(conversation: any[], scenario: any) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchangeCount = Math.floor(conversation.length / 2);
  
  return {
    opening_rapport: {
      score: userMessages.length > 0 ? 3 : 2,
      feedback: userMessages.length > 0 ? 'Good engagement in the conversation.' : 'Could work on initial engagement.'
    },
    communication_style: {
      score: exchangeCount >= 3 ? 4 : 3,
      feedback: exchangeCount >= 3 ? 'Maintained good conversation flow.' : 'Could extend conversation for better practice.'
    },
    strengths: [
      'Participated actively in the roleplay session',
      exchangeCount >= 3 ? 'Sustained conversation well' : 'Showed willingness to engage'
    ],
    improvements: [
      exchangeCount < 3 ? 'Try to ask more questions to extend the conversation' : 'Continue building on conversation skills',
      'Practice more scenarios to build confidence'
    ],
    next_focus: 'Focus on asking more discovery questions and building rapport.'
  };
}

// Calculate detailed scores across multiple dimensions
function calculateDetailedScores(conversation: any[], scenario: any, analysis: any) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchangeCount = Math.floor(conversation.length / 2);
  
  // Base scores on conversation metrics and AI analysis
  const categories = {
    opening_rapport: analysis.opening_rapport?.score || calculateEngagementScore(userMessages, exchangeCount),
    discovery_needs: calculateDiscoveryScore(userMessages, scenario.category),
    communication_clarity: calculateClarityScore(userMessages),
    problem_solving: calculateProblemSolvingScore(conversation, scenario.category),
    professionalism: calculateProfessionalismScore(userMessages, scenario.category)
  };
  
  // Calculate overall score as weighted average
  const weights = { opening_rapport: 0.2, discovery_needs: 0.25, communication_clarity: 0.2, problem_solving: 0.2, professionalism: 0.15 };
  const overall = Object.entries(categories).reduce((sum, [key, score]) => {
    return sum + (score * (weights[key as keyof typeof weights] || 0.2));
  }, 0);
  
  return {
    overall: Math.round(overall * 100) / 100,
    categories
  };
}

// Individual scoring functions
function calculateEngagementScore(userMessages: any[], exchangeCount: number): number {
  if (exchangeCount === 0) return 1;
  if (exchangeCount < 3) return 2.5;
  if (exchangeCount < 6) return 3.5;
  if (exchangeCount < 10) return 4.2;
  return 4.8;
}

function calculateDiscoveryScore(userMessages: any[], category: string): number {
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who', '?'];
  const questionCount = userMessages.filter(msg => 
    questionWords.some(word => msg.message.toLowerCase().includes(word))
  ).length;
  
  if (questionCount === 0) return 2;
  if (questionCount < 2) return 3;
  if (questionCount < 4) return 4;
  return 4.5;
}

function calculateClarityScore(userMessages: any[]): number {
  const avgLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  
  if (avgLength < 20) return 2.5; // Too short
  if (avgLength < 50) return 4; // Good length
  if (avgLength < 100) return 4.5; // Detailed
  return 3.5; // Maybe too long
}

function calculateProblemSolvingScore(conversation: any[], category: string): number {
  // Look for solution-oriented language
  const solutionKeywords = ['solution', 'help', 'resolve', 'fix', 'improve', 'benefit', 'value'];
  const solutionMentions = conversation.filter(msg => 
    msg.speaker === 'user' && solutionKeywords.some(word => msg.message.toLowerCase().includes(word))
  ).length;
  
  if (solutionMentions === 0) return 2;
  if (solutionMentions < 2) return 3;
  if (solutionMentions < 4) return 4;
  return 4.5;
}

function calculateProfessionalismScore(userMessages: any[], category: string): number {
  // Base score of 4, deduct for unprofessional elements
  let score = 4;
  
  const unprofessionalWords = ['um', 'uh', 'like', 'whatever', 'dunno'];
  const hasUnprofessional = userMessages.some(msg => 
    unprofessionalWords.some(word => msg.message.toLowerCase().includes(word))
  );
  
  if (hasUnprofessional) score -= 0.5;
  
  return Math.max(2, score);
}

// Generate coaching recommendations
function generateCoachingRecommendations(analysis: any, scores: any, scenario: any) {
  const recommendations = {
    immediate_actions: [] as string[],
    practice_areas: [] as string[],
    advanced_techniques: [] as string[],
    next_scenarios: [] as string[]
  };

  // Based on scores, generate specific recommendations
  if (scores.categories.opening_rapport < 3.5) {
    recommendations.immediate_actions.push('Work on building rapport early in conversations');
    recommendations.practice_areas.push('Practice opening statements and connection building');
  }
  
  if (scores.categories.discovery_needs < 3.5) {
    recommendations.immediate_actions.push('Ask more open-ended questions to understand needs');
    recommendations.practice_areas.push('Question techniques and active listening');
  }
  
  if (scores.categories.communication_clarity < 3.5) {
    recommendations.immediate_actions.push('Focus on clear, concise communication');
    recommendations.practice_areas.push('Message structuring and clarity');
  }

  // Advanced recommendations for higher scores
  if (scores.overall >= 4) {
    recommendations.advanced_techniques.push('Practice handling complex objections');
    recommendations.advanced_techniques.push('Work on advanced closing techniques');
  }

  // Scenario recommendations
  const currentDifficulty = scenario.difficulty;
  if (scores.overall >= 4 && currentDifficulty === 'beginner') {
    recommendations.next_scenarios.push('Try intermediate difficulty scenarios');
  } else if (scores.overall >= 4.5 && currentDifficulty === 'intermediate') {
    recommendations.next_scenarios.push('Challenge yourself with advanced scenarios');
  }

  return recommendations;
}

// Identify improvement areas
function identifyImprovementAreas(scores: any): string[] {
  const areas = [];
  const threshold = 3.5;
  
  if (scores.categories.opening_rapport < threshold) {
    areas.push('Rapport building and initial connection');
  }
  if (scores.categories.discovery_needs < threshold) {
    areas.push('Asking questions and understanding needs');
  }
  if (scores.categories.communication_clarity < threshold) {
    areas.push('Communication clarity and structure');
  }
  if (scores.categories.problem_solving < threshold) {
    areas.push('Problem-solving and solution presentation');
  }
  if (scores.categories.professionalism < threshold) {
    areas.push('Professional communication style');
  }
  
  return areas;
}

// Identify strengths
function identifyStrengths(scores: any, analysis: any): string[] {
  const strengths = [];
  const threshold = 4;
  
  if (scores.categories.opening_rapport >= threshold) {
    strengths.push('Strong rapport building and connection skills');
  }
  if (scores.categories.discovery_needs >= threshold) {
    strengths.push('Excellent questioning and needs discovery');
  }
  if (scores.categories.communication_clarity >= threshold) {
    strengths.push('Clear and effective communication');
  }
  if (scores.categories.problem_solving >= threshold) {
    strengths.push('Strong problem-solving approach');
  }
  if (scores.categories.professionalism >= threshold) {
    strengths.push('Highly professional communication style');
  }
  
  // Add analysis-based strengths
  if (analysis.strengths) {
    strengths.push(...analysis.strengths.slice(0, 2));
  }
  
  return strengths;
}

// Generate next session focus - FIXED TypeScript error
function generateNextSessionFocus(scores: any, category: string): string {
  const lowestArea = Object.entries(scores.categories).reduce((lowest, [area, score]) => 
    (score as number) < lowest.score ? { area, score: score as number } : lowest, 
    { area: 'overall', score: 5 }
  );

  const focusMap: Record<string, string> = {
    'opening_rapport': 'Focus on building stronger initial connections and rapport',
    'discovery_needs': 'Practice asking more probing questions to understand needs',
    'communication_clarity': 'Work on clear, structured communication',
    'problem_solving': 'Develop stronger problem-solving and solution presentation skills',
    'professionalism': 'Enhance professional communication style and presence'
  };

  return focusMap[lowestArea.area] || `Continue practicing ${category} scenarios to build confidence`;
}

// Calculate skill progression
function calculateSkillProgression(scores: any) {
  const overall = scores.overall;
  
  if (overall < 2.5) return { level: 'Developing', next: 'Foundation Building', progress: 25 };
  if (overall < 3.5) return { level: 'Improving', next: 'Skill Development', progress: 50 };
  if (overall < 4.2) return { level: 'Proficient', next: 'Advanced Techniques', progress: 75 };
  return { level: 'Advanced', next: 'Mastery', progress: 90 };
}
