// app/api/analyze-conversation-enhanced/route.ts - Enhanced Conversation Analysis
export async function POST(request: Request) {
  try {
    const { conversation, scenario, sessionId, sessionData } = await request.json();
    
    if (!conversation || !scenario) {
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

    console.log('🧠 Enhanced conversation analysis:', {
      sessionId,
      messageCount: conversation.length,
      role: scenario.role,
      duration: sessionData?.duration || 0
    });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ No Gemini API key, using enhanced fallback');
      return Response.json({
        success: true,
        data: generateEnhancedFallback(conversation, scenario, sessionData),
        source: 'enhanced-fallback'
      });
    }

    // Enhanced analysis with full context
    const analysisResult = await performEnhancedAnalysis(conversation, scenario, sessionId, sessionData);
    
    console.log('✅ Enhanced analysis completed');

    return Response.json({
      success: true,
      data: analysisResult,
      source: 'ai-enhanced'
    });

  } catch (error) {
    console.error('💥 Enhanced analysis API error:', error);
    
    const fallbackResult = generateEnhancedFallback(
      (await request.json()).conversation || [],
      (await request.json()).scenario || {},
      (await request.json()).sessionData || {}
    );
    
    return Response.json({
      success: true,
      data: fallbackResult,
      source: 'error-fallback'
    });
  }
}

async function performEnhancedAnalysis(conversation: any[], scenario: any, sessionId: string, sessionData: any) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  
  const analysisPrompt = buildEnhancedAnalysisPrompt(conversation, scenario, sessionData, userRole);
  
  console.log('🤖 Calling Gemini for enhanced analysis...');
  
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
          maxOutputTokens: 1200,
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

  return parseEnhancedAnalysis(aiAnalysis, conversation, scenario, sessionData);
}

function buildEnhancedAnalysisPrompt(conversation: any[], scenario: any, sessionData: any, userRole: string): string {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  
  const conversationText = conversation.map((msg, i) => 
    `${msg.speaker === 'user' ? `USER (${userRole})` : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  return `You are an expert ${scenario.role.replace('-', ' ')} communication coach analyzing a practice session.

ANALYZE ONLY THE USER'S PERFORMANCE as a ${userRole}. Ignore the AI character's responses.

SESSION DETAILS:
- Scenario: "${scenario.title}"
- User Role: ${userRole}
- Character: ${scenario.character_name} (${scenario.character_role})
- Duration: ${duration} minutes
- Exchanges: ${exchanges}
- Natural Ending: ${sessionData?.naturalEnding ? 'Yes' : 'No'}

COMPLETE CONVERSATION:
${conversationText}

USER MESSAGES ONLY (Focus your analysis on these):
${userMessages.map((msg, i) => `${i+1}. "${msg.message}"`).join('\n')}

Provide comprehensive feedback in this EXACT format:

OVERALL_IMPRESSION: [2-3 sentences about the USER's overall performance as a ${userRole}]

WHAT_WORKED_WELL: [List 3-4 specific things the USER did well]

AREAS_TO_IMPROVE: [List 3-4 specific areas for improvement]

COACHING_ADVICE: [Detailed advice for improving ${userRole} skills]

SCORE: [Rate 1-5 based on conversation management, communication skills, and goal achievement]

Focus exclusively on the USER's ${userRole} performance.`;
}

function parseEnhancedAnalysis(aiResponse: string, conversation: any[], scenario: any, sessionData: any) {
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

  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: overall_impression || `You completed a ${userRole} practice session with ${scenario.character_name}. ${sessionData?.naturalEnding ? 'The conversation reached a natural conclusion' : 'The session covered key topics'} over ${exchanges} exchanges.`,
      what_worked_well: what_worked_well.length > 0 ? what_worked_well : [
        `You actively engaged as a ${userRole} throughout the conversation`,
        `You maintained professional communication during the ${duration}-minute session`,
        'You participated consistently in the role-play exercise'
      ],
      areas_to_improve: areas_to_improve.length > 0 ? areas_to_improve : [
        `Continue developing your ${userRole} conversation techniques`,
        'Practice bringing conversations to natural conclusions',
        'Work on achieving conversation goals more systematically'
      ],
      coaching_advice: coaching_advice || `Your ${userRole} practice session ${sessionData?.naturalEnding ? 'was well-structured with a natural ending' : 'covered important ground'}. Focus on systematic objective completion in future sessions.`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: duration,
      conversation_quality: exchanges >= 8 ? 8.5 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 6.0 : 5.0,
      completeness_score: exchanges >= 8 ? 9.0 : exchanges >= 6 ? 7.5 : exchanges >= 4 ? 6.0 : 4.5,
      natural_ending: sessionData?.naturalEnding || false
    },
    analysis_type: 'enhanced-ai-analysis',
    timestamp: new Date().toISOString()
  };
}

function generateEnhancedFallback(conversation: any[], scenario: any, sessionData: any) {
  console.log('📊 Creating enhanced fallback analysis...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  
  // Enhanced scoring based on multiple factors
  let score = 2.5;
  score += exchanges >= 2 ? 0.5 : 0;
  score += exchanges >= 4 ? 0.5 : 0;
  score += exchanges >= 6 ? 0.5 : 0;
  score += exchanges >= 8 ? 0.5 : 0;
  score += duration >= 3 ? 0.3 : 0;
  score += sessionData?.naturalEnding ? 0.5 : 0;
  score = Math.min(5.0, score);

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: `You practiced as a ${userRole} with ${scenario.character_name} ${sessionData?.naturalEnding ? 'and successfully brought the conversation to a natural conclusion' : 'over ' + exchanges + ' exchanges'}. Your conversation quality was ${exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : exchanges >= 4 ? 'solid' : 'developing'}.`,
      what_worked_well: [
        `You actively participated in the ${userRole} role-play exercise`,
        exchanges >= 6 ? `You sustained the conversation well with ${exchanges} exchanges` : 'You engaged professionally with the AI character',
        duration >= 5 ? `You invested ${duration} minutes in meaningful practice` : 'You committed time to skill development',
        sessionData?.naturalEnding ? 'You successfully guided the conversation to a natural conclusion' : 'You stayed focused on the scenario objectives'
      ].slice(0, 3),
      areas_to_improve: [
        exchanges < 6 ? `Try to extend conversations longer for more comprehensive ${userRole} practice` : 'Continue building on your conversation management skills',
        !sessionData?.naturalEnding ? 'Practice bringing conversations to natural, professional conclusions' : 'Try to explore topics in even greater depth',
        'Work on systematically covering key professional objectives',
        'Continue developing your communication confidence'
      ].slice(0, 3),
      coaching_advice: `Your ${userRole} practice session ${sessionData?.naturalEnding ? 'demonstrated good conversation management with a natural ending' : 'covered important ground'}. ${exchanges >= 8 ? 'Excellent depth - continue practicing with similar engagement.' : exchanges >= 6 ? 'Good progress - focus on extending conversations naturally.' : 'Keep practicing to build conversation confidence and depth.'}`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: userMessages.length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: duration,
      conversation_quality: exchanges >= 8 ? 8.0 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 6.0 : 5.0,
      completeness_score: exchanges >= 8 ? 8.5 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 5.5 : 4.0,
      natural_ending: sessionData?.naturalEnding || false
    },
    analysis_type: 'enhanced-fallback',
    timestamp: new Date().toISOString()
  };
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
