// app/api/analyze-conversation/route.ts - Gemini-powered feedback analysis
export async function POST(request: Request) {
  try {
    const { conversation, scenario, sessionId, sessionData } = await request.json();
    
    if (!conversation || !scenario || conversation.length < 2) {
      return Response.json(
        { success: false, error: 'Invalid conversation data' },
        { status: 400 }
      );
    }

    console.log('🧠 Analyzing conversation with Gemini...', {
      sessionId,
      messageCount: conversation.length,
      role: scenario.role
    });

    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.warn('⚠️ No Gemini API key, using fallback analysis');
      return Response.json({
        success: true,
        data: generateFallbackAnalysis(conversation, scenario, sessionData),
        source: 'fallback'
      });
    }

    // Generate analysis with Gemini
    const analysisResult = await performGeminiAnalysis(conversation, scenario, sessionData);
    
    console.log('✅ Gemini analysis completed');

    return Response.json({
      success: true,
      data: analysisResult,
      source: 'gemini'
    });

  } catch (error) {
    console.error('❌ Analysis API error:', error);
    
    // Fallback to local analysis
    const { conversation, scenario, sessionData } = await request.json().catch(() => ({ conversation: [], scenario: {}, sessionData: {} }));
    
    return Response.json({
      success: true,
      data: generateFallbackAnalysis(conversation, scenario, sessionData),
      source: 'error-fallback'
    });
  }
}

async function performGeminiAnalysis(conversation: any[], scenario: any, sessionData: any) {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  
  // Build analysis prompt
  const analysisPrompt = buildAnalysisPrompt(conversation, scenario, userRole, exchanges, duration);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
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
    throw new Error(`Gemini analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiAnalysis) {
    throw new Error('No analysis from Gemini');
  }

  return parseGeminiAnalysis(aiAnalysis, conversation, scenario, sessionData);
}

function buildAnalysisPrompt(conversation: any[], scenario: any, userRole: string, exchanges: number, duration: number): string {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  
  const conversationText = conversation.map((msg, i) => 
    `${msg.speaker === 'user' ? `USER (${userRole})` : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  return `You are an expert ${scenario.role.replace('-', ' ')} communication coach. Analyze this practice session focusing ONLY on the user's performance.

SESSION DETAILS:
- Scenario: "${scenario.title}"
- User Role: ${userRole}
- Character: ${scenario.character_name} (${scenario.character_role})
- Duration: ${duration} minutes
- Exchanges: ${exchanges}

COMPLETE CONVERSATION:
${conversationText}

USER MESSAGES TO ANALYZE:
${userMessages.map((msg, i) => `${i+1}. "${msg.message}"`).join('\n')}

Provide feedback in this EXACT format:

SCORE: [Rate 1-5 based on conversation skills, engagement, and professionalism]

OVERALL_IMPRESSION: [2-3 sentences about the user's overall performance as a ${userRole}]

STRENGTHS: [List 3 specific things the user did well in this conversation]

IMPROVEMENTS: [List 3 specific areas where the user could improve]

COACHING_ADVICE: [Detailed paragraph with actionable advice for improving ${userRole} skills]

Focus exclusively on the user's communication skills and performance.`;
}

function parseGeminiAnalysis(aiResponse: string, conversation: any[], scenario: any, sessionData: any) {
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  let overall_score = 3.0;
  let overall_impression = '';
  let what_worked_well: string[] = [];
  let areas_to_improve: string[] = [];
  let coaching_advice = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('SCORE:')) {
      const scoreMatch = trimmed.match(/(\d+\.?\d*)/);
      if (scoreMatch) {
        overall_score = Math.min(5.0, Math.max(1.0, parseFloat(scoreMatch[1])));
      }
    } else if (trimmed.startsWith('OVERALL_IMPRESSION:')) {
      overall_impression = trimmed.replace('OVERALL_IMPRESSION:', '').trim();
    } else if (trimmed.startsWith('STRENGTHS:')) {
      // Parse following lines as strengths
      const nextLines = lines.slice(lines.indexOf(line) + 1);
      for (const nextLine of nextLines) {
        const content = nextLine.trim().replace(/^[-•*]\s*/, '');
        if (content && !content.includes(':') && content.length > 10) {
          what_worked_well.push(content);
          if (what_worked_well.length >= 3) break;
        }
        if (nextLine.includes(':')) break;
      }
    } else if (trimmed.startsWith('IMPROVEMENTS:')) {
      // Parse following lines as improvements
      const nextLines = lines.slice(lines.indexOf(line) + 1);
      for (const nextLine of nextLines) {
        const content = nextLine.trim().replace(/^[-•*]\s*/, '');
        if (content && !content.includes(':') && content.length > 10) {
          areas_to_improve.push(content);
          if (areas_to_improve.length >= 3) break;
        }
        if (nextLine.includes(':')) break;
      }
    } else if (trimmed.startsWith('COACHING_ADVICE:')) {
      coaching_advice = trimmed.replace('COACHING_ADVICE:', '').trim();
      // Include following lines until next section
      const nextLines = lines.slice(lines.indexOf(line) + 1);
      for (const nextLine of nextLines) {
        if (nextLine.trim() && !nextLine.includes(':')) {
          coaching_advice += ' ' + nextLine.trim();
        } else {
          break;
        }
      }
    }
  }

  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;

  return {
    overall_score,
    human_feedback: {
      overall_impression: overall_impression || `You completed a ${userRole} practice session with ${scenario.character_name} over ${exchanges} exchanges in ${duration} minutes.`,
      what_worked_well: what_worked_well.length > 0 ? what_worked_well : [
        `You actively participated in the ${userRole} conversation`,
        `You maintained professional communication throughout`,
        'You engaged consistently with the AI character'
      ],
      areas_to_improve: areas_to_improve.length > 0 ? areas_to_improve : [
        `Continue developing your ${userRole} conversation techniques`,
        'Practice bringing conversations to natural conclusions',
        'Work on achieving specific conversation objectives'
      ],
      coaching_advice: coaching_advice || `Your ${userRole} practice session covered important ground. Continue practicing to build conversation confidence and achieve objectives more systematically.`
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
      completeness_score: exchanges >= 8 ? 8.0 : exchanges >= 6 ? 6.5 : exchanges >= 4 ? 5.0 : 4.0,
      natural_ending: sessionData?.naturalEnding || false
    },
    analysis_type: 'gemini-analysis',
    timestamp: new Date().toISOString()
  };
}

function generateFallbackAnalysis(conversation: any[], scenario: any, sessionData: any) {
  console.log('📊 Generating fallback analysis...');
  
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  
  // Calculate score based on engagement
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
      overall_impression: `You completed a ${userRole} practice session with ${scenario.character_name}. The conversation included ${exchanges} exchanges over ${duration} minutes, showing ${exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : exchanges >= 4 ? 'solid' : 'basic'} engagement.`,
      what_worked_well: [
        `You actively participated as a ${userRole} throughout the conversation`,
        exchanges >= 6 ? `You sustained good conversation flow with ${exchanges} exchanges` : 'You maintained professional engagement with the AI character',
        duration >= 5 ? `You invested ${duration} minutes in meaningful practice` : 'You committed time to skill development'
      ],
      areas_to_improve: [
        exchanges < 6 ? `Try extending conversations longer for more comprehensive ${userRole} practice` : 'Continue building advanced conversation techniques',
        !sessionData?.naturalEnding ? 'Practice bringing conversations to natural, professional conclusions' : 'Explore topics in greater depth in future sessions',
        'Focus on systematically achieving conversation objectives'
      ],
      coaching_advice: `Your ${userRole} practice session ${sessionData?.naturalEnding ? 'reached a natural conclusion, showing good conversation management' : 'covered important ground'}. ${exchanges >= 8 ? 'Excellent engagement - continue with similar depth.' : exchanges >= 6 ? 'Good progress - focus on extending conversations naturally.' : 'Keep practicing to build conversation confidence.'} Regular practice will help you develop stronger professional communication skills.`
    },
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: duration,
      conversation_quality: exchanges >= 8 ? 8.0 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 6.0 : 5.0,
      completeness_score: exchanges >= 8 ? 8.5 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 5.5 : 4.0,
      natural_ending: sessionData?.naturalEnding || false
    },
    analysis_type: 'fallback-analysis',
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
    'support-agent': 'customer service representative',
    'data-analyst': 'data analyst',
    'engineer': 'engineer',
    'nurse': 'healthcare provider',
    'doctor': 'healthcare provider'
  };
  return roleMap[scenarioRole] || 'professional';
}
