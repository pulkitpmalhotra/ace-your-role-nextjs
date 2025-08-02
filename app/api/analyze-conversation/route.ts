// app/api/analyze-conversation/route.ts - REAL AI-Powered Analysis (No More Mock Data)
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

    console.log('🧠 Starting REAL AI analysis for session:', session_id);
    console.log('📊 Analyzing', conversation.length, 'messages in', scenario.category);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return Response.json(
        { success: false, error: 'AI analysis service unavailable' },
        { status: 503 }
      );
    }

    // Build comprehensive analysis prompt
    const analysisPrompt = buildComprehensiveAnalysisPrompt(conversation, scenario);
    
    console.log('🤖 Calling Gemini for comprehensive conversation analysis...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for analytical consistency
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1500, // Increased for detailed analysis
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini analysis failed:', response.status, errorText);
      return Response.json(
        { success: false, error: 'AI analysis failed' },
        { status: 503 }
      );
    }

    const data = await response.json();
    const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiAnalysis) {
      console.error('❌ No analysis content from Gemini');
      return Response.json(
        { success: false, error: 'Analysis failed to generate' },
        { status: 503 }
      );
    }

    // Parse the comprehensive AI analysis
    const parsedAnalysis = parseComprehensiveAnalysis(aiAnalysis, conversation, scenario);
    
    // Generate coaching recommendations based on AI insights
    const coaching = generatePersonalizedCoaching(parsedAnalysis, scenario);
    
    // Create final feedback structure
    const feedback = {
      session_id,
      overall_score: parsedAnalysis.overall_score,
      category_scores: parsedAnalysis.category_scores,
      conversation_analysis: {
        specific_strengths: parsedAnalysis.specific_strengths,
        specific_improvements: parsedAnalysis.specific_improvements,
        conversation_flow_analysis: parsedAnalysis.conversation_flow,
        character_interaction_quality: parsedAnalysis.character_interaction,
        ai_assessment: parsedAnalysis.ai_assessment
      },
      coaching_insights: coaching,
      improvement_areas: parsedAnalysis.improvement_areas,
      strengths: parsedAnalysis.strengths,
      next_session_focus: parsedAnalysis.next_focus,
      skill_progression: calculatePersonalizedProgression(parsedAnalysis),
      personalized_feedback: parsedAnalysis.personalized_feedback,
      timestamp: new Date().toISOString(),
      analysis_type: 'ai-powered-real'
    };

    console.log('✅ Real AI analysis completed. Overall score:', parsedAnalysis.overall_score);

    return Response.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('💥 AI Analysis error:', error);
    return Response.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// Build comprehensive analysis prompt that analyzes ACTUAL conversation content
function buildComprehensiveAnalysisPrompt(conversation: any[], scenario: any) {
  // Extract actual user messages and AI responses
  const userMessages = conversation.filter(msg => msg.speaker === 'user').map(msg => msg.message);
  const aiMessages = conversation.filter(msg => msg.speaker === 'ai').map(msg => msg.message);
  
  // Build conversation transcript
  const conversationTranscript = conversation.map((msg, index) => 
    `${index + 1}. ${msg.speaker === 'user' ? 'TRAINEE' : scenario.character_name}: "${msg.message}"`
  ).join('\n');

  const categoryContext = getCategoryAnalysisContext(scenario.category);
  
  return `You are an expert ${scenario.category} communication coach analyzing a real roleplay conversation. Provide specific, personalized feedback based on what the trainee actually said and did.

SCENARIO CONTEXT:
- Title: ${scenario.title}
- Character: ${scenario.character_name} (${scenario.character_role})
- Category: ${scenario.category}
- Difficulty: ${scenario.difficulty}
- Character Personality: ${scenario.character_personality || 'Professional with realistic concerns'}

ACTUAL CONVERSATION TRANSCRIPT:
${conversationTranscript}

ANALYSIS FRAMEWORK FOR ${scenario.category.toUpperCase()}:
${categoryContext}

INSTRUCTIONS:
Analyze this SPECIFIC conversation. Do not give generic feedback. Base everything on what the trainee actually said and how they performed.

Provide detailed analysis in this exact format:

OVERALL_SCORE: [1-5 with one decimal, based on actual performance quality]

CATEGORY_SCORES:
Opening_Rapport: [1-5 score] | [Specific feedback about their actual opening]
Discovery_Needs: [1-5 score] | [Analysis of their actual questioning]
Communication_Clarity: [1-5 score] | [Assessment of their actual communication]
Problem_Solving: [1-5 score] | [Evaluation of their actual approach]
Professionalism: [1-5 score] | [Review of their actual professional behavior]

SPECIFIC_STRENGTHS:
• [Specific example from conversation of what they did well]
• [Another specific strength with quote/example]
• [Third specific strength with evidence]

SPECIFIC_IMPROVEMENTS:
• [Specific area where they struggled, with example]
• [Another improvement area with specific evidence]
• [Third improvement with suggestion]

CONVERSATION_FLOW:
[Analysis of how the conversation progressed, specific to this session]

CHARACTER_INTERACTION:
[How well they interacted with ${scenario.character_name} specifically]

PERSONALIZED_FEEDBACK:
[3-4 sentences of specific feedback about their unique performance]

NEXT_FOCUS:
[Specific recommendation for their next practice session based on this performance]

Be specific, reference actual quotes when possible, and avoid generic advice. Focus on what THIS trainee did in THIS conversation.`;
}

// Get category-specific analysis context
function getCategoryAnalysisContext(category: string): string {
  const contexts: Record<string, string> = {
    'sales': `
    Evaluate: Opening approach, needs discovery questions, value presentation, objection handling, closing attempts
    Look for: Active listening, rapport building, solution-focused language, ROI discussions, next steps
    Red flags: Being pushy, not listening, generic solutions, poor objection responses`,
    
    'healthcare': `
    Evaluate: Empathy demonstration, information gathering, explanation clarity, concern addressing, care planning
    Look for: Compassionate language, thorough questioning, simple explanations, reassurance, follow-up planning
    Red flags: Lack of empathy, rushed consultation, medical jargon without explanation, dismissing concerns`,
    
    'support': `
    Evaluate: Issue comprehension, empathy, problem-solving approach, solution clarity, satisfaction confirmation
    Look for: Active listening, acknowledgment of frustration, systematic troubleshooting, clear instructions
    Red flags: Dismissive attitude, not understanding the problem, complex instructions, no follow-up`,
    
    'leadership': `
    Evaluate: Communication style, listening skills, feedback delivery, support provision, goal setting
    Look for: Collaborative approach, specific feedback, encouragement, clear expectations, development focus
    Red flags: Authoritarian tone, vague feedback, lack of support, unclear expectations`,
    
    'legal': `
    Evaluate: Professional demeanor, information gathering, explanation clarity, risk communication, client management
    Look for: Professional language, thorough questioning, simple legal explanations, risk awareness, next steps
    Red flags: Legal jargon without explanation, rushed consultation, inadequate information gathering`
  };
  
  return contexts[category] || contexts['sales'];
}

// Parse the comprehensive AI analysis into structured format
function parseComprehensiveAnalysis(aiResponse: string, conversation: any[], scenario: any) {
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  let overall_score = 3.0;
  const category_scores: any = {};
  const specific_strengths: string[] = [];
  const specific_improvements: string[] = [];
  let conversation_flow = '';
  let character_interaction = '';
  let personalized_feedback = '';
  let next_focus = '';
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('OVERALL_SCORE:')) {
      const scoreMatch = trimmed.match(/(\d+\.?\d*)/);
      if (scoreMatch) {
        overall_score = Math.min(5.0, Math.max(1.0, parseFloat(scoreMatch[1])));
      }
    } else if (trimmed.includes('CATEGORY_SCORES:')) {
      currentSection = 'category_scores';
    } else if (trimmed.includes('SPECIFIC_STRENGTHS:')) {
      currentSection = 'strengths';
    } else if (trimmed.includes('SPECIFIC_IMPROVEMENTS:')) {
      currentSection = 'improvements';
    } else if (trimmed.includes('CONVERSATION_FLOW:')) {
      currentSection = 'flow';
    } else if (trimmed.includes('CHARACTER_INTERACTION:')) {
      currentSection = 'interaction';
    } else if (trimmed.includes('PERSONALIZED_FEEDBACK:')) {
      currentSection = 'feedback';
    } else if (trimmed.includes('NEXT_FOCUS:')) {
      currentSection = 'next';
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.replace(/^[•\-]\s*/, '').trim();
      if (content) {
        if (currentSection === 'strengths') {
          specific_strengths.push(content);
        } else if (currentSection === 'improvements') {
          specific_improvements.push(content);
        }
      }
    } else if (currentSection === 'category_scores' && trimmed.includes(':')) {
      // Parse category scores: "Opening_Rapport: 4 | Great opening approach"
      const parts = trimmed.split('|');
      if (parts.length >= 2) {
        const scorePart = parts[0].trim();
        const feedback = parts[1].trim();
        const scoreMatch = scorePart.match(/(\d+\.?\d*)/);
        if (scoreMatch) {
          const categoryName = scorePart.split(':')[0].trim().toLowerCase().replace('_', '_');
          category_scores[categoryName] = {
            score: Math.min(5.0, Math.max(1.0, parseFloat(scoreMatch[1]))),
            feedback: feedback
          };
        }
      }
    } else if (currentSection === 'flow' && trimmed) {
      conversation_flow += trimmed + ' ';
    } else if (currentSection === 'interaction' && trimmed) {
      character_interaction += trimmed + ' ';
    } else if (currentSection === 'feedback' && trimmed) {
      personalized_feedback += trimmed + ' ';
    } else if (currentSection === 'next' && trimmed) {
      next_focus += trimmed + ' ';
    }
  }

  // Ensure we have all required category scores
  const requiredCategories = ['opening_rapport', 'discovery_needs', 'communication_clarity', 'problem_solving', 'professionalism'];
  requiredCategories.forEach(cat => {
    if (!category_scores[cat]) {
      category_scores[cat] = {
        score: overall_score,
        feedback: 'Performance assessment based on overall conversation quality'
      };
    }
  });

  return {
    overall_score,
    category_scores,
    specific_strengths: specific_strengths.length > 0 ? specific_strengths : ['Participated actively in the conversation'],
    specific_improvements: specific_improvements.length > 0 ? specific_improvements : ['Continue practicing to build confidence'],
    conversation_flow: conversation_flow.trim() || 'Maintained good conversation flow throughout the session',
    character_interaction: character_interaction.trim() || `Interacted professionally with ${scenario.character_name}`,
    personalized_feedback: personalized_feedback.trim() || 'Good effort in this practice session. Continue building your skills.',
    next_focus: next_focus.trim() || 'Focus on expanding conversation depth and asking more follow-up questions',
    improvement_areas: specific_improvements.slice(0, 3),
    strengths: specific_strengths.slice(0, 3),
    ai_assessment: 'Generated by AI analysis of actual conversation content'
  };
}

// Generate personalized coaching based on AI analysis
function generatePersonalizedCoaching(analysis: any, scenario: any) {
  const recommendations = {
    immediate_actions: [] as string[],
    practice_areas: [] as string[],
    advanced_techniques: [] as string[],
    next_scenarios: [] as string[]
  };

  // Generate recommendations based on actual performance
  if (analysis.overall_score < 3.0) {
    recommendations.immediate_actions.push('Focus on fundamental conversation skills');
    recommendations.practice_areas.push('Basic rapport building and active listening');
  } else if (analysis.overall_score >= 4.0) {
    recommendations.advanced_techniques.push('Practice handling complex objections');
    recommendations.advanced_techniques.push('Work on advanced persuasion techniques');
  }

  // Category-specific recommendations
  Object.entries(analysis.category_scores).forEach(([category, data]: [string, any]) => {
    if (data.score < 3.5) {
      recommendations.practice_areas.push(`Improve ${category.replace('_', ' ')} skills`);
    }
  });

  // Scenario progression recommendations
  if (analysis.overall_score >= 4.0 && scenario.difficulty === 'beginner') {
    recommendations.next_scenarios.push('Try intermediate difficulty scenarios');
  } else if (analysis.overall_score >= 4.5 && scenario.difficulty === 'intermediate') {
    recommendations.next_scenarios.push('Challenge yourself with advanced scenarios');
  }

  return recommendations;
}

// Calculate personalized skill progression
function calculatePersonalizedProgression(analysis: any) {
  const overall = analysis.overall_score;
  
  if (overall < 2.5) return { level: 'Developing', next: 'Foundation Building', progress: Math.round(overall * 20) };
  if (overall < 3.5) return { level: 'Improving', next: 'Skill Development', progress: Math.round(overall * 20) };
  if (overall < 4.2) return { level: 'Proficient', next: 'Advanced Techniques', progress: Math.round(overall * 20) };
  return { level: 'Advanced', next: 'Mastery', progress: Math.round(overall * 20) };
}
