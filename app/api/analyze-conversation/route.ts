// app/api/analyze-conversation/route.ts - Human-like AI Analysis
export async function POST(request: Request) {
  try {
    const { conversation, scenario, session_id } = await request.json();
    
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

    console.log('🧠 Starting human-like conversation analysis for session:', session_id);
    console.log('📊 Analyzing', conversation.length, 'messages in', scenario.role, 'scenario');

    // Try AI analysis first
    let analysisResult;
    
    try {
      analysisResult = await performHumanLikeAIAnalysis(conversation, scenario, session_id);
      console.log('✅ Human-like AI analysis completed successfully');
    } catch (aiError) {
      console.warn('⚠️ AI analysis failed, using intelligent fallback:', aiError);
      analysisResult = performIntelligentFallback(conversation, scenario, session_id);
    }

    return Response.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('💥 Analysis API error:', error);
    
    // Provide meaningful feedback even on error
    const fallbackResult = createMeaningfulFallback(conversation, scenario);
    
    return Response.json({
      success: true,
      data: fallbackResult
    });
  }
}

// Human-like AI analysis using Gemini
async function performHumanLikeAIAnalysis(conversation: any[], scenario: any, session_id: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Build human-like analysis prompt
  const analysisPrompt = buildHumanCoachPrompt(conversation, scenario);
  
  console.log('🤖 Calling Gemini for human-like conversation analysis...');
  
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

  // Parse the human-like AI response
  const parsedAnalysis = parseHumanLikeAnalysis(aiAnalysis, conversation, scenario);
  
  return {
    ...parsedAnalysis,
    session_id,
    timestamp: new Date().toISOString(),
    analysis_type: 'human-like-ai'
  };
}

// Build a prompt that makes AI respond like a human coach
function buildHumanCoachPrompt(conversation: any[], scenario: any) {
  const conversationText = conversation.map((msg, i) => 
    `${msg.speaker === 'user' ? 'You' : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchanges = Math.floor(conversation.length / 2);

  return `You are an experienced ${scenario.role.replace('-', ' ')} coach who just observed a practice conversation. 

I watched you practice with ${scenario.character_name} in this ${scenario.role} scenario: "${scenario.title}"

Here's what happened in your conversation:
${conversationText}

As your coach, I want to give you honest, helpful feedback that feels personal and actionable. Write your response as if you're talking directly to the person, like a real coach would.

Please provide feedback in this EXACT format:

OVERALL_IMPRESSION: [Write 2-3 sentences about your overall impression of how they did, mentioning specific things you noticed from their actual conversation]

WHAT_WORKED_WELL: [List 2-3 specific things they did well, referencing actual parts of their conversation]

AREAS_TO_IMPROVE: [List 2-3 specific areas for improvement, based on what you observed]

COACHING_ADVICE: [Give practical, actionable advice for their next practice session, specific to their role and what you saw]

SCORE: [Give a score from 1-5 based on their actual performance]

Make it feel like you actually listened to their conversation and are giving personalized advice, not generic feedback.`;
}

// Parse the human-like AI response
function parseHumanLikeAnalysis(aiResponse: string, conversation: any[], scenario: any) {
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
      // Handle both bullet points and plain text
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

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: overall_impression || `You had a good conversation with ${scenario.character_name}. I can see you engaged thoughtfully with the scenario.`,
      what_worked_well: what_worked_well.length > 0 ? what_worked_well : [
        'You participated actively in the conversation',
        'You maintained a professional tone throughout'
      ],
      areas_to_improve: areas_to_improve.length > 0 ? areas_to_improve : [
        'Try to ask more questions to deepen the conversation',
        'Consider expanding on your responses for more detail'
      ],
      coaching_advice: coaching_advice || `Keep practicing ${scenario.role} scenarios to build your confidence and skills.`
    },
    conversation_stats: {
      total_exchanges: Math.floor(conversation.length / 2),
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role
    }
  };
}

// Intelligent fallback that's still personalized
function performIntelligentFallback(conversation: any[], scenario: any, session_id: string) {
  console.log('📊 Creating intelligent personalized fallback...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchanges = Math.floor(conversation.length / 2);
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length;
  
  // Analyze conversation content for real insights
  const hasQuestions = userMessages.some(msg => msg.message.includes('?'));
  const hasDetailedResponses = avgMessageLength > 30;
  const goodLength = exchanges >= 3;
  
  let score = 2.5; // Base score
  if (goodLength) score += 0.5;
  if (hasQuestions) score += 0.3;
  if (hasDetailedResponses) score += 0.4;
  if (exchanges >= 5) score += 0.3;
  score = Math.min(5.0, score);

  // Create personalized feedback based on actual conversation
  const impressions = [
    goodLength ? 
      `I noticed you kept the conversation going for ${exchanges} exchanges with ${scenario.character_name}, which shows good engagement.` :
      `Your conversation with ${scenario.character_name} was brief with ${exchanges} exchanges. Consider extending it longer next time.`,
    
    hasDetailedResponses ? 
      'You provided thoughtful, detailed responses which helped build rapport.' :
      'Your responses were concise. Try adding more detail to build stronger connections.',
      
    hasQuestions ?
      'I saw you asking questions, which is great for keeping the conversation flowing.' :
      'Consider asking more questions to show interest and gather information.'
  ];

  const strengths = [];
  const improvements = [];

  if (goodLength) strengths.push(`You maintained ${exchanges} conversation exchanges, showing persistence`);
  if (hasQuestions) strengths.push('You asked questions to engage with the character');
  if (hasDetailedResponses) strengths.push('Your responses were detailed and thoughtful');
  if (!goodLength) improvements.push('Try to extend conversations longer for more practice');
  if (!hasQuestions) improvements.push('Ask more questions to gather information and show interest');
  if (!hasDetailedResponses) improvements.push('Provide more detailed responses to build better rapport');

  // Default fallbacks if nothing specific found
  if (strengths.length === 0) strengths.push('You participated actively in the practice session');
  if (improvements.length === 0) improvements.push('Continue practicing to build confidence');

  return {
    overall_score: score,
    human_feedback: {
      overall_impression: impressions[0],
      what_worked_well: strengths.slice(0, 3),
      areas_to_improve: improvements.slice(0, 3),
      coaching_advice: `For your next ${scenario.role.replace('-', ' ')} practice, focus on ${improvements[0]?.toLowerCase() || 'building conversation depth and engagement'}.`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: userMessages.length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role
    },
    session_id,
    timestamp: new Date().toISOString(),
    analysis_type: 'intelligent-fallback'
  };
}

// Meaningful fallback for errors
function createMeaningfulFallback(conversation: any[], scenario: any) {
  const exchanges = Math.floor(conversation.length / 2);
  
  return {
    overall_score: 3.0,
    human_feedback: {
      overall_impression: `You completed a practice session with ${scenario.character_name}. Every practice session helps build your ${scenario.role.replace('-', ' ')} skills.`,
      what_worked_well: [
        'You took the initiative to practice',
        'You engaged with the AI character',
        'You completed the conversation'
      ],
      areas_to_improve: [
        'Continue practicing regularly to build skills',
        'Try different scenarios to expand experience',
        'Focus on active listening and engagement'
      ],
      coaching_advice: 'Keep practicing different scenarios to build confidence and improve your communication skills.'
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role
    },
    timestamp: new Date().toISOString(),
    analysis_type: 'minimal-fallback'
  };
}
