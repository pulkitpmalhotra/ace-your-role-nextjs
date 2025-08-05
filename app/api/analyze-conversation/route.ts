// app/api/analyze-conversation/route.ts - FIXED: Focus on User Performance
import { NextRequest } from 'next/server';
export async function POST(request: Request) {
  let conversation, scenario, session_id;
  
  try {
    const requestData = await request.json();
    conversation = requestData.conversation;
    scenario = requestData.scenario;
    session_id = requestData.session_id;
    
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

    console.log('🧠 Starting USER PERFORMANCE analysis for session:', session_id);
    console.log('📊 Analyzing USER behavior in', conversation.length, 'messages in', scenario.role, 'scenario');

    // Try AI analysis first - FOCUSED ON USER
    let analysisResult;
    
    try {
      analysisResult = await performUserFocusedAIAnalysis(conversation, scenario, session_id);
      console.log('✅ User-focused AI analysis completed successfully');
    } catch (aiError) {
      console.warn('⚠️ AI analysis failed, using intelligent fallback:', aiError);
      analysisResult = performUserFocusedFallback(conversation, scenario, session_id);
    }

    return Response.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('💥 Analysis API error:', error);
    
    // Provide meaningful feedback even on error - with safe fallback
    const fallbackResult = createUserFocusedFallback(
      conversation || [], 
      scenario || { role: 'unknown', character_name: 'Character', title: 'Practice Session' }
    );
    
    return Response.json({
      success: true,
      data: fallbackResult
    });
  }
}

// USER-FOCUSED AI analysis using Gemini
async function performUserFocusedAIAnalysis(conversation: any[], scenario: any, session_id: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Build USER-FOCUSED analysis prompt
  const analysisPrompt = buildUserPerformancePrompt(conversation, scenario);
  
  console.log('🤖 Calling Gemini for USER PERFORMANCE analysis...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.8, // Higher for more human-like responses
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1200, // More space for detailed feedback
          candidateCount: 1,
        }
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiAnalysis) {
    throw new Error('No analysis content from Gemini');
  }

  // Parse the USER-FOCUSED AI response
  const parsedAnalysis = parseUserFocusedAnalysis(aiAnalysis, conversation, scenario);
  
  return {
    ...parsedAnalysis,
    session_id,
    timestamp: new Date().toISOString(),
    analysis_type: 'user-performance-focused'
  };
}

// Build a prompt that CLEARLY focuses on analyzing the USER's performance
function buildUserPerformancePrompt(conversation: any[], scenario: any) {
  // Extract only USER messages for analysis
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getRoleForUser(scenario.role); // What role the USER is practicing
  
  const conversationText = conversation.map((msg, i) => 
    `${msg.speaker === 'user' ? `PRACTITIONER (${userRole})` : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  const exchanges = Math.floor(conversation.length / 2);

  return `You are an expert ${scenario.role.replace('-', ' ')} communication coach. You just observed someone PRACTICING their ${userRole} skills in a roleplay scenario.

CRITICAL: You are analyzing the PRACTITIONER's performance, NOT the AI character's responses.

SCENARIO DETAILS:
- Practice Session: "${scenario.title}"
- Character: ${scenario.character_name} (${scenario.character_role})
- Role Being Practiced: ${userRole}
- Difficulty: ${scenario.difficulty}

THE PERSON PRACTICING WAS THE ${userRole.toUpperCase()} - analyze THEIR performance only.

CONVERSATION TRANSCRIPT:
${conversationText}

ANALYSIS FOCUS:
- Analyze how well the PRACTITIONER performed as a ${userRole}
- Evaluate THEIR communication skills, not the character's responses
- Focus on what the PRACTITIONER said and how they said it
- Ignore the AI character's performance entirely

USER MESSAGES TO ANALYZE:
${userMessages.map((msg, i) => `${i+1}. "${msg.message}"`).join('\n')}

Provide feedback in this EXACT format:

OVERALL_IMPRESSION: [Write 2-3 sentences about how the PRACTITIONER performed as a ${userRole}, mentioning specific things from THEIR messages]

WHAT_WORKED_WELL: [List 2-3 specific things the PRACTITIONER did well in their ${userRole} performance]

AREAS_TO_IMPROVE: [List 2-3 specific areas where the PRACTITIONER can improve their ${userRole} skills]

COACHING_ADVICE: [Give practical advice for the PRACTITIONER to improve their ${userRole} performance in future sessions]

SCORE: [Rate the PRACTITIONER's ${userRole} performance from 1-5]

Focus ONLY on the person practicing the ${userRole} role. Ignore the AI character completely.`;
}

// Get the role the USER is practicing (not the character they're talking to)
function getRoleForUser(scenarioRole: string): string {
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

// Parse the USER-FOCUSED AI response
function parseUserFocusedAnalysis(aiResponse: string, conversation: any[], scenario: any) {
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

  const userRole = getRoleForUser(scenario.role);

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: overall_impression || `You practiced your ${userRole} skills with ${scenario.character_name}. Your communication showed good engagement with the scenario.`,
      what_worked_well: what_worked_well.length > 0 ? what_worked_well : [
        `You actively participated in the ${userRole} conversation`,
        'You maintained a professional tone throughout your responses'
      ],
      areas_to_improve: areas_to_improve.length > 0 ? areas_to_improve : [
        `Try asking more probing questions to deepen your ${userRole} approach`,
        'Consider expanding on your responses to build stronger rapport'
      ],
      coaching_advice: coaching_advice || `Continue practicing ${userRole} scenarios to build your confidence and refine your communication techniques.`
    },
    conversation_stats: {
      total_exchanges: Math.floor(conversation.length / 2),
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole // Add this to be clear
    }
  };
}

// USER-FOCUSED fallback that's still personalized
function performUserFocusedFallback(conversation: any[], scenario: any, session_id: string) {
  console.log('📊 Creating USER-FOCUSED personalized fallback...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchanges = Math.floor(conversation.length / 2);
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  
  // Analyze USER conversation content for real insights
  const userAskedQuestions = userMessages.some(msg => msg.message.includes('?'));
  const userGaveDetailedResponses = avgMessageLength > 30;
  const goodEngagement = exchanges >= 3;
  
  let score = 2.5; // Base score
  if (goodEngagement) score += 0.5;
  if (userAskedQuestions) score += 0.3;
  if (userGaveDetailedResponses) score += 0.4;
  if (exchanges >= 5) score += 0.3;
  score = Math.min(5.0, score);

  const userRole = getRoleForUser(scenario.role);

  // Create personalized feedback based on USER's actual performance
  const impressions = [
    goodEngagement ? 
      `I noticed you maintained ${exchanges} exchanges as a ${userRole} with ${scenario.character_name}, which shows good conversation management.` :
      `Your ${userRole} conversation with ${scenario.character_name} was brief with ${exchanges} exchanges. Consider extending it longer next time.`,
    
    userGaveDetailedResponses ? 
      `You provided thoughtful, detailed responses as a ${userRole}, which helped build the professional relationship.` :
      `Your ${userRole} responses were concise. Try adding more detail to strengthen your professional communication.`,
      
    userAskedQuestions ?
      `I saw you asking questions as a ${userRole}, which is excellent for gathering information and maintaining engagement.` :
      `As a ${userRole}, consider asking more questions to show interest and gather important information.`
  ];

  const strengths = [];
  const improvements = [];

  if (goodEngagement) strengths.push(`You sustained ${exchanges} conversation exchanges as a ${userRole}, showing good persistence`);
  if (userAskedQuestions) strengths.push(`You asked questions to engage effectively in your ${userRole} role`);
  if (userGaveDetailedResponses) strengths.push(`Your ${userRole} responses were detailed and thoughtful`);
  if (!goodEngagement) improvements.push(`Try to extend your ${userRole} conversations longer for more practice`);
  if (!userAskedQuestions) improvements.push(`Ask more questions to demonstrate your ${userRole} skills and gather information`);
  if (!userGaveDetailedResponses) improvements.push(`Provide more detailed responses to build stronger professional rapport as a ${userRole}`);

  // Default fallbacks if nothing specific found
  if (strengths.length === 0) strengths.push(`You actively participated as a ${userRole} in the practice session`);
  if (improvements.length === 0) improvements.push(`Continue practicing to build confidence in your ${userRole} skills`);

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: impressions[0],
      what_worked_well: strengths.slice(0, 3),
      areas_to_improve: improvements.slice(0, 3),
      coaching_advice: `For your next ${userRole} practice session, focus on ${improvements[0]?.toLowerCase() || 'building conversation depth and professional engagement'}.`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: userMessages.length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole
    },
    session_id,
    timestamp: new Date().toISOString(),
    analysis_type: 'user-focused-fallback'
  };
}

// USER-FOCUSED fallback for errors
function createUserFocusedFallback(conversation: any[], scenario: any) {
  const exchanges = conversation && conversation.length ? Math.floor(conversation.length / 2) : 0;
  const characterName = scenario?.character_name || 'Character';
  const scenarioTitle = scenario?.title || 'Practice Session';
  const roleType = scenario?.role || 'communication';
  const userRole = getRoleForUser(roleType);
  
  return {
    overall_score: 3.0,
    human_feedback: {
      overall_impression: `You completed a ${userRole} practice session with ${characterName}. Every practice session helps build your professional communication skills.`,
      what_worked_well: [
        `You took the initiative to practice your ${userRole} skills`,
        'You engaged with the AI character in a professional scenario',
        'You completed the conversation exercise'
      ],
      areas_to_improve: [
        `Continue practicing regularly to build stronger ${userRole} skills`,
        `Try different ${roleType.replace('-', ' ')} scenarios to expand your experience`,
        'Focus on active listening and professional engagement techniques'
      ],
      coaching_advice: `Keep practicing different ${userRole} scenarios to build confidence and improve your professional communication abilities.`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: conversation ? conversation.filter(msg => msg.speaker === 'user').length : 0,
      character_name: characterName,
      scenario_title: scenarioTitle,
      role_type: roleType,
      user_role_practiced: userRole
    },
    timestamp: new Date().toISOString(),
    analysis_type: 'user-focused-minimal-fallback'
  };
}
