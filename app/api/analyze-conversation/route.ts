// app/api/analyze-conversation/route.ts - Enhanced Gemini Speech Analysis
export async function POST(request: Request) {
  try {
    const { conversation, scenario, sessionId, sessionData } = await request.json();
    
    if (!conversation || !scenario || conversation.length < 2) {
      return Response.json(
        { success: false, error: 'Invalid conversation data' },
        { status: 400 }
      );
    }

    console.log('🧠 Enhanced speech analysis with Gemini...', {
      sessionId,
      messageCount: conversation.length,
      role: scenario.role
    });

    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.warn('⚠️ No Gemini API key, using fallback analysis');
      return Response.json({
        success: true,
        data: generateFallbackSpeechAnalysis(conversation, scenario, sessionData),
        source: 'fallback'
      });
    }

    // Perform enhanced speech analysis
    const analysisResult = await performEnhancedSpeechAnalysis(conversation, scenario, sessionData);
    
    console.log('✅ Enhanced Gemini speech analysis completed');

    return Response.json({
      success: true,
      data: analysisResult,
      source: 'gemini-enhanced'
    });

  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    
    const { conversation, scenario, sessionData } = await request.json().catch(() => ({ conversation: [], scenario: {}, sessionData: {} }));
    
    return Response.json({
      success: true,
      data: generateFallbackSpeechAnalysis(conversation, scenario, sessionData),
      source: 'error-fallback'
    });
  }
}

async function performEnhancedSpeechAnalysis(conversation: any[], scenario: any, sessionData: any) {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY!;
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const totalDuration = sessionData?.duration || 0;
  const userSpeakingTime = calculateUserSpeakingTime(userMessages, totalDuration);
  
  // Build comprehensive analysis prompt
  const analysisPrompt = buildEnhancedSpeechAnalysisPrompt(
    conversation, 
    scenario, 
    userRole, 
    userSpeakingTime,
    totalDuration
  );
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2000,
          candidateCount: 1,
        }
      }),
      signal: AbortSignal.timeout(45000) // Longer timeout for comprehensive analysis
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini enhanced analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const aiAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiAnalysis) {
    throw new Error('No enhanced analysis from Gemini');
  }

  return parseEnhancedSpeechAnalysis(aiAnalysis, conversation, scenario, sessionData, userSpeakingTime);
}

function buildEnhancedSpeechAnalysisPrompt(
  conversation: any[], 
  scenario: any, 
  userRole: string, 
  userSpeakingTime: number,
  totalDuration: number
): string {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const exchanges = Math.floor(conversation.length / 2);
  
  // Get scenario objectives
  const scenarioObjectives = getScenarioObjectives(scenario.role);
  
  const userText = userMessages.map(msg => msg.message).join(' ');
  const wordCount = userText.split(' ').length;
  const estimatedWPM = userSpeakingTime > 0 ? Math.round(wordCount / (userSpeakingTime / 60)) : 0;

  return `You are an expert speech coach analyzing a ${userRole} practice session. Provide detailed analysis focusing on specific speech patterns and professional communication effectiveness.

SESSION DETAILS:
- Scenario: "${scenario.title}"
- User Role: ${userRole}
- Character: ${scenario.character_name} (${scenario.character_role})
- Total Duration: ${totalDuration} minutes
- User Speaking Time: ${userSpeakingTime} minutes
- Exchanges: ${exchanges}
- Estimated Speaking Speed: ${estimatedWPM} words per minute

USER'S COMPLETE TEXT TO ANALYZE:
"${userText}"

SCENARIO OBJECTIVES FOR ${userRole.toUpperCase()}:
${scenarioObjectives.map(obj => `- ${obj}`).join('\n')}

Analyze the user's speech patterns and provide feedback in this EXACT format:

OVERALL_SCORE: [Rate 1-5 based on professional communication effectiveness]

FILLER_WORDS:
Frequency: [Count of um, uh, like, you know, etc.]
Examples: [List specific instances]
Impact: [How fillers affected professionalism]

SPEAKING_SPEED:
Speed: [${estimatedWPM} WPM - Too Fast/Too Slow/Appropriate]
Assessment: [Detailed analysis for this scenario type]
Recommendation: [Specific speed adjustment advice]

INCLUSIVE_LANGUAGE:
Issues: [Flag any non-inclusive language or assumptions]
Examples: [Specific instances if found]
Suggestions: [How to improve inclusivity]

WORD_CHOICE:
Weak_Words: [Identify hesitant language like "maybe", "I think", "sort of"]
Strong_Alternatives: [Suggest confident replacements]
Professional_Tone: [Assessment of business language appropriateness]

REPETITION_ANALYSIS:
Repeated_Words: [Words/phrases used multiple times]
Frequency: [How often each was repeated]
Impact: [Effect on message clarity]

TALK_TIME:
User_Speaking: ${userSpeakingTime} minutes (${Math.round((userSpeakingTime/totalDuration)*100)}% of session)
Balance_Assessment: [Too much/Too little/Appropriate for ${userRole}]
Recommendation: [How to optimize talk time]

OBJECTIVES_ANALYSIS:
Completed: [Which scenario objectives were achieved]
Missed: [Which objectives weren't addressed]
Evidence: [Specific examples from conversation]
Improvement_Strategy: [Detailed plan for future sessions]

PROFESSIONAL_COMMUNICATION:
Strengths: [Specific communication strengths demonstrated]
Weaknesses: [Areas needing development]
Industry_Language: [Use of appropriate ${scenario.role} terminology]

FUTURE_IMPROVEMENT:
Priority_Focus: [Top 3 areas to work on next]
Practice_Recommendations: [Specific exercises or techniques]
Next_Session_Goals: [Measurable objectives for improvement]

Focus exclusively on speech patterns, word choice, and professional communication effectiveness.`;
}

function parseEnhancedSpeechAnalysis(
  aiResponse: string, 
  conversation: any[], 
  scenario: any, 
  sessionData: any,
  userSpeakingTime: number
) {
  const sections = parseAnalysisSections(aiResponse);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  
  // Extract overall score
  const scoreMatch = aiResponse.match(/OVERALL_SCORE:\s*(\d+\.?\d*)/i);
  const overallScore = scoreMatch ? Math.min(5.0, Math.max(1.0, parseFloat(scoreMatch[1]))) : 3.0;

  return {
    overall_score: overallScore,
    
    // Enhanced speech analysis data
    speech_analysis: {
      filler_words: {
        frequency: extractValue(sections.filler_words, 'Frequency') || 'Not detected',
        examples: extractValue(sections.filler_words, 'Examples') || [],
        impact: extractValue(sections.filler_words, 'Impact') || 'No significant impact detected'
      },
      
      speaking_speed: {
        speed: extractValue(sections.speaking_speed, 'Speed') || 'Unable to assess',
        assessment: extractValue(sections.speaking_speed, 'Assessment') || 'Speed analysis unavailable',
        recommendation: extractValue(sections.speaking_speed, 'Recommendation') || 'Continue at current pace'
      },
      
      inclusive_language: {
        issues: extractValue(sections.inclusive_language, 'Issues') || 'No issues detected',
        examples: extractValue(sections.inclusive_language, 'Examples') || [],
        suggestions: extractValue(sections.inclusive_language, 'Suggestions') || 'Continue using inclusive language'
      },
      
      word_choice: {
        weak_words: extractValue(sections.word_choice, 'Weak_Words') || [],
        strong_alternatives: extractValue(sections.word_choice, 'Strong_Alternatives') || [],
        professional_tone: extractValue(sections.word_choice, 'Professional_Tone') || 'Professional tone maintained'
      },
      
      repetition: {
        repeated_words: extractValue(sections.repetition_analysis, 'Repeated_Words') || [],
        frequency: extractValue(sections.repetition_analysis, 'Frequency') || 'No significant repetition',
        impact: extractValue(sections.repetition_analysis, 'Impact') || 'No negative impact detected'
      },
      
      talk_time: {
        user_speaking_minutes: userSpeakingTime,
        percentage: Math.round((userSpeakingTime / duration) * 100),
        balance_assessment: extractValue(sections.talk_time, 'Balance_Assessment') || 'Appropriate balance',
        recommendation: extractValue(sections.talk_time, 'Recommendation') || 'Maintain current balance'
      }
    },
    
    objectives_analysis: {
      completed: extractListValue(sections.objectives_analysis, 'Completed') || [],
      missed: extractListValue(sections.objectives_analysis, 'Missed') || [],
      evidence: extractValue(sections.objectives_analysis, 'Evidence') || 'Evidence not available',
      improvement_strategy: extractValue(sections.objectives_analysis, 'Improvement_Strategy') || 'Continue current approach'
    },
    
    professional_communication: {
      strengths: extractListValue(sections.professional_communication, 'Strengths') || [],
      weaknesses: extractListValue(sections.professional_communication, 'Weaknesses') || [],
      industry_language: extractValue(sections.professional_communication, 'Industry_Language') || 'Appropriate for role'
    },
    
    future_improvement: {
      priority_focus: extractListValue(sections.future_improvement, 'Priority_Focus') || [],
      practice_recommendations: extractListValue(sections.future_improvement, 'Practice_Recommendations') || [],
      next_session_goals: extractListValue(sections.future_improvement, 'Next_Session_Goals') || []
    },
    
    // Session metadata
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: conversation.filter(msg => msg.speaker === 'user').length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: getUserRole(scenario.role),
      session_duration: duration,
      user_speaking_time: userSpeakingTime,
      natural_ending: sessionData?.naturalEnding || false
    },
    
    analysis_type: 'enhanced-speech-analysis',
    timestamp: new Date().toISOString()
  };
}

function parseAnalysisSections(aiResponse: string) {
  const sections: any = {};
  const sectionNames = [
    'filler_words', 'speaking_speed', 'inclusive_language', 'word_choice',
    'repetition_analysis', 'talk_time', 'objectives_analysis', 
    'professional_communication', 'future_improvement'
  ];
  
  for (const sectionName of sectionNames) {
    const regex = new RegExp(`${sectionName.toUpperCase()}:(.*?)(?=${sectionNames.map(s => s.toUpperCase()).join('|')}|$)`, 'is');
    const match = aiResponse.match(regex);
    sections[sectionName] = match ? match[1].trim() : '';
  }
  
  return sections;
}

function extractValue(section: string, key: string): string {
  const regex = new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z]|$)`, 'i');
  const match = section.match(regex);
  return match ? match[1].trim() : '';
}

function extractListValue(section: string, key: string): string[] {
  const value = extractValue(section, key);
  if (!value) return [];
  
  // Split by common delimiters and clean up
  return value
    .split(/[,\n\-•]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .slice(0, 5); // Limit to 5 items
}

function calculateUserSpeakingTime(userMessages: any[], totalDuration: number): number {
  // Estimate user speaking time based on message lengths and total duration
  const totalMessages = userMessages.length * 2; // Include AI responses
  const userMessageCount = userMessages.length;
  
  if (totalMessages === 0) return 0;
  
  // Rough estimate: user speaks about 40-60% of the time in a conversation
  const estimatedUserPercentage = 0.5;
  return Math.round(totalDuration * estimatedUserPercentage * 10) / 10; // Round to 1 decimal
}

function getScenarioObjectives(role: string): string[] {
  const objectives: Record<string, string[]> = {
    'sales': [
      'Build rapport and establish trust with the prospect',
      'Identify customer needs and pain points through questioning',
      'Present solution benefits clearly and persuasively',
      'Handle objections professionally and confidently',
      'Guide conversation toward next steps or commitment'
    ],
    'project-manager': [
      'Clarify project scope, timeline, and deliverables',
      'Identify stakeholders and their requirements',
      'Communicate risks and mitigation strategies',
      'Ensure alignment on priorities and resources',
      'Establish clear next steps and accountability'
    ],
    'product-manager': [
      'Gather comprehensive user requirements and feedback',
      'Prioritize features based on business impact',
      'Communicate product vision and strategy clearly',
      'Align stakeholders on product roadmap decisions',
      'Validate assumptions with data and user insights'
    ],
    'leader': [
      'Communicate organizational vision and strategic direction',
      'Inspire and motivate team members toward common goals',
      'Build consensus while making decisive leadership choices',
      'Foster innovation and drive positive organizational change',
      'Demonstrate emotional intelligence and active listening'
    ],
    'manager': [
      'Provide specific, constructive feedback on performance',
      'Set clear expectations and measurable goals',
      'Support professional development and career growth',
      'Address challenges while maintaining positive relationships',
      'Create accountability and follow-through systems'
    ],
    'support-agent': [
      'Quickly understand and diagnose customer issues',
      'Show empathy while maintaining professional boundaries',
      'Provide clear, step-by-step solutions and guidance',
      'Ensure complete issue resolution and customer satisfaction',
      'Document interactions and follow up effectively'
    ],
    'data-analyst': [
      'Understand business questions and analytical requirements',
      'Communicate findings clearly to non-technical stakeholders',
      'Provide actionable insights and data-driven recommendations',
      'Validate results and consider alternative explanations',
      'Establish metrics and success criteria for analysis'
    ],
    'engineer': [
      'Understand technical requirements and system constraints',
      'Communicate technical concepts to non-technical stakeholders',
      'Collaborate effectively on solution architecture decisions',
      'Consider security, performance, and maintainability factors',
      'Provide accurate estimates and project timelines'
    ],
    'nurse': [
      'Provide compassionate and professional patient care',
      'Communicate clearly about procedures and care plans',
      'Coordinate effectively with medical team members',
      'Ensure patient comfort and understanding throughout care',
      'Follow proper protocols and documentation procedures'
    ],
    'doctor': [
      'Gather comprehensive patient history and symptoms',
      'Explain medical conditions and treatment options clearly',
      'Show empathy while maintaining professional clinical judgment',
      'Involve patients in treatment decisions and ensure informed consent',
      'Provide clear follow-up instructions and care planning'
    ]
  };
  
  return objectives[role] || objectives['sales'];
}

function generateFallbackSpeechAnalysis(conversation: any[], scenario: any, sessionData: any) {
  console.log('📊 Generating fallback speech analysis...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  const userSpeakingTime = calculateUserSpeakingTime(userMessages, duration);
  
  const userText = userMessages.map(msg => msg.message).join(' ');
  const wordCount = userText.split(' ').length;
  const estimatedWPM = userSpeakingTime > 0 ? Math.round(wordCount / (userSpeakingTime / 60)) : 0;
  
  // Basic pattern detection
  const fillerWords = (userText.match(/\b(um|uh|like|you know|actually|basically)\b/gi) || []).length;
  const weakWords = (userText.match(/\b(maybe|I think|sort of|kind of|probably)\b/gi) || []).length;
  
  return {
    overall_score: Math.min(5.0, 2.5 + (exchanges >= 4 ? 1 : 0) + (duration >= 5 ? 1 : 0) + (fillerWords < 5 ? 0.5 : 0)),
    
    speech_analysis: {
      filler_words: {
        frequency: fillerWords,
        examples: fillerWords > 0 ? ['Basic analysis detected filler words'] : [],
        impact: fillerWords > 5 ? 'Moderate impact on professionalism' : 'Minimal impact detected'
      },
      
      speaking_speed: {
        speed: `${estimatedWPM} WPM - ${estimatedWPM > 180 ? 'Too Fast' : estimatedWPM < 120 ? 'Too Slow' : 'Appropriate'}`,
        assessment: `For ${userRole} conversations, your pace appears ${estimatedWPM > 180 ? 'rushed' : estimatedWPM < 120 ? 'slow' : 'well-balanced'}`,
        recommendation: estimatedWPM > 180 ? 'Try slowing down for better clarity' : estimatedWPM < 120 ? 'Consider speaking with more confidence' : 'Maintain current speaking pace'
      },
      
      inclusive_language: {
        issues: 'Automated analysis could not detect specific issues',
        examples: [],
        suggestions: 'Continue being mindful of inclusive language in professional settings'
      },
      
      word_choice: {
        weak_words: weakWords > 0 ? ['Hesitant language detected'] : [],
        strong_alternatives: weakWords > 0 ? ['Use more confident, direct language'] : [],
        professional_tone: weakWords > 3 ? 'Could be more assertive' : 'Generally professional'
      },
      
      repetition: {
        repeated_words: ['Analysis limited in fallback mode'],
        frequency: 'Cannot determine without advanced analysis',
        impact: 'No significant repetition detected'
      },
      
      talk_time: {
        user_speaking_minutes: userSpeakingTime,
        percentage: Math.round((userSpeakingTime / duration) * 100),
        balance_assessment: userSpeakingTime > duration * 0.7 ? 'Talking too much' : userSpeakingTime < duration * 0.3 ? 'Not speaking enough' : 'Good balance',
        recommendation: 'Aim for balanced conversation with active listening'
      }
    },
    
    objectives_analysis: {
      completed: ['Basic conversation engagement'],
      missed: ['Advanced analysis unavailable in fallback mode'],
      evidence: `Completed ${exchanges} exchanges showing basic communication`,
      improvement_strategy: 'Continue practicing to develop more advanced conversation skills'
    },
    
    professional_communication: {
      strengths: ['Active participation', 'Maintained conversation flow'],
      weaknesses: ['Detailed analysis requires enhanced mode'],
      industry_language: 'Basic professional language maintained'
    },
    
    future_improvement: {
      priority_focus: ['Reduce filler words', 'Increase confidence', 'Achieve specific objectives'],
      practice_recommendations: ['Regular conversation practice', 'Record and review sessions'],
      next_session_goals: ['Extend conversation length', 'Focus on specific objectives']
    },
    
    conversation_stats: {
      total_exchanges: exchanges,
      user_messages: userMessages.length,
      character_name: scenario.character_name,
      scenario_title: scenario.title,
      role_type: scenario.role,
      user_role_practiced: userRole,
      session_duration: duration,
      user_speaking_time: userSpeakingTime,
      natural_ending: sessionData?.naturalEnding || false
    },
    
    analysis_type: 'fallback-speech-analysis',
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
