// app/api/analyze-conversation/route.ts - Updated with Vercel AI SDK
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(request: Request) {
  try {
    const { conversation, scenario, sessionId, sessionData } = await request.json();
    
    if (!conversation || !scenario || conversation.length < 2) {
      return Response.json(
        { success: false, error: 'Invalid conversation data' },
        { status: 400 }
      );
    }

    console.log('🧠 Focused speech analysis with Vercel AI SDK + Gemini...', {
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

    // Perform focused speech analysis with Vercel AI SDK
    const analysisResult = await performFocusedSpeechAnalysis(conversation, scenario, sessionData);
    
    console.log('✅ Focused Vercel AI SDK + Gemini speech analysis completed');

    return Response.json({
      success: true,
      data: analysisResult,
      source: 'vercel-ai-sdk-gemini'
    });

  } catch (error) {
    console.error('❌ Focused analysis error:', error);
    
    const { conversation, scenario, sessionData } = await request.json().catch(() => ({ conversation: [], scenario: {}, sessionData: {} }));
    
    return Response.json({
      success: true,
      data: generateFallbackAnalysis(conversation, scenario, sessionData),
      source: 'error-fallback'
    });
  }
}

async function performFocusedSpeechAnalysis(conversation: any[], scenario: any, sessionData: any) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const totalDuration = sessionData?.duration || 0;
  const userSpeakingTime = calculateUserSpeakingTime(userMessages, totalDuration);
  
  // Build focused analysis prompt
  const analysisPrompt = buildFocusedAnalysisPrompt(
    conversation, 
    scenario, 
    userRole, 
    userSpeakingTime,
    totalDuration
  );
  
  try {
    // Use Vercel AI SDK with Gemini 2.0 Flash Experimental
    // API key should be set in environment as GOOGLE_GENERATIVE_AI_API_KEY
    const { text: aiAnalysis } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: analysisPrompt,
      temperature: 0.2, // Lower for more consistent analysis
      maxTokens: 1500,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0.1, // Reduce repetition in analysis
      presencePenalty: 0.1, // Encourage diverse feedback
    });

    if (!aiAnalysis || aiAnalysis.trim().length === 0) {
      throw new Error('Empty analysis from Gemini');
    }

    return parseFocusedAnalysis(aiAnalysis, conversation, scenario, sessionData, userSpeakingTime);

  } catch (aiError) {
    console.error('❌ Vercel AI SDK + Gemini analysis error:', aiError);
    throw new Error(`Gemini analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
  }
}

function buildFocusedAnalysisPrompt(
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

  return `You are an expert speech coach analyzing a ${userRole} practice session. Focus ONLY on these 7 specific areas:

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

Analyze ONLY these 7 areas and provide feedback in this EXACT format:

OVERALL_SCORE: [Rate 1-5 based on professional communication effectiveness]

FILLER_WORDS:
Count: [Exact number of um, uh, like, you know, actually, basically, sort of, kind of found]
Examples: [List specific instances with quotes]
Impact: [How fillers affected professionalism - rate as Minimal/Moderate/High impact]

SPEAKING_SPEED:
Speed: [${estimatedWPM} WPM]
Assessment: [Too Fast/Too Slow/Appropriate for ${userRole} conversations]
Recommendation: [Specific advice for optimal speed in this scenario type]

INCLUSIVE_LANGUAGE:
Issues: [Flag any non-inclusive language, assumptions, or biased terms]
Examples: [Quote specific instances if found]
Suggestions: [How to improve inclusivity and avoid bias]

WEAK_WORDS:
Weak_Words: [List hesitant language: maybe, I think, sort of, kind of, probably, possibly]
Strong_Alternatives: [Suggest confident replacements]
Professional_Impact: [How weak words affected authority and credibility]

REPETITION:
Repeated_Words: [Words/phrases used 3+ times]
Frequency: [How often each was repeated]
Impact: [Effect on message clarity and professionalism]

TALK_TIME:
User_Speaking: ${userSpeakingTime} minutes (${Math.round((userSpeakingTime/totalDuration)*100)}% of session)
Balance_Assessment: [Too much/Too little/Appropriate for ${userRole} role]
Recommendation: [How to optimize speaking vs listening balance]

OBJECTIVES_ANALYSIS:
Completed: [Which scenario objectives were clearly achieved with evidence]
Missed: [Which objectives weren't addressed or were handled poorly]
Evidence: [Specific examples from the conversation supporting assessments]
Next_Steps: [Concrete actions to improve objective completion]

Focus exclusively on speech patterns, communication effectiveness, and scenario objective completion. Provide specific, actionable feedback.`;
}

function parseFocusedAnalysis(
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
    
    // Focused speech analysis data
    speech_analysis: {
      filler_words: {
        count: extractNumericValue(sections.filler_words, 'Count') || 0,
        examples: extractListValue(sections.filler_words, 'Examples') || [],
        impact: extractValue(sections.filler_words, 'Impact') || 'Unable to assess'
      },
      
      speaking_speed: {
        speed: extractValue(sections.speaking_speed, 'Speed') || 'Unable to assess',
        assessment: extractValue(sections.speaking_speed, 'Assessment') || 'Assessment unavailable',
        recommendation: extractValue(sections.speaking_speed, 'Recommendation') || 'Continue at current pace'
      },
      
      inclusive_language: {
        issues: extractValue(sections.inclusive_language, 'Issues') || 'No issues detected',
        examples: extractListValue(sections.inclusive_language, 'Examples') || [],
        suggestions: extractValue(sections.inclusive_language, 'Suggestions') || 'Continue using inclusive language'
      },
      
      weak_words: {
        weak_words: extractListValue(sections.weak_words, 'Weak_Words') || [],
        strong_alternatives: extractListValue(sections.weak_words, 'Strong_Alternatives') || [],
        professional_impact: extractValue(sections.weak_words, 'Professional_Impact') || 'No significant impact detected'
      },
      
      repetition: {
        repeated_words: extractListValue(sections.repetition, 'Repeated_Words') || [],
        frequency: extractValue(sections.repetition, 'Frequency') || 'No significant repetition',
        impact: extractValue(sections.repetition, 'Impact') || 'No negative impact detected'
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
      next_steps: extractValue(sections.objectives_analysis, 'Next_Steps') || 'Continue current approach'
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
    
    analysis_type: 'vercel-ai-sdk-gemini-focused-analysis',
    timestamp: new Date().toISOString()
  };
}

function parseAnalysisSections(aiResponse: string) {
  const sections: any = {};
  const sectionNames = [
    'filler_words', 'speaking_speed', 'inclusive_language', 'weak_words',
    'repetition', 'talk_time', 'objectives_analysis'
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

function extractNumericValue(section: string, key: string): number {
  const value = extractValue(section, key);
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function extractListValue(section: string, key: string): string[] {
  const value = extractValue(section, key);
  if (!value || value.toLowerCase().includes('none') || value.toLowerCase().includes('no ')) return [];
  
  // Split by common delimiters and clean up
  return value
    .split(/[,\n\-•]/)
    .map(item => item.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
    .filter(item => item.length > 0 && !item.toLowerCase().includes('none'))
    .slice(0, 8); // Limit to 8 items
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

function generateFallbackAnalysis(conversation: any[], scenario: any, sessionData: any) {
  console.log('📊 Generating fallback focused analysis...');
  
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  const userRole = getUserRole(scenario.role);
  const exchanges = Math.floor(conversation.length / 2);
  const duration = sessionData?.duration || 0;
  const userSpeakingTime = calculateUserSpeakingTime(userMessages, duration);
  
  const userText = userMessages.map(msg => msg.message).join(' ');
  const wordCount = userText.split(' ').length;
  const estimatedWPM = userSpeakingTime > 0 ? Math.round(wordCount / (userSpeakingTime / 60)) : 0;
  
  // Basic pattern detection
  const fillerWords = (userText.match(/\b(um|uh|like|you know|actually|basically|sort of|kind of)\b/gi) || []).length;
  const weakWords = (userText.match(/\b(maybe|I think|sort of|kind of|probably|possibly)\b/gi) || []).length;
  
  return {
    overall_score: Math.min(5.0, 2.5 + (exchanges >= 4 ? 1 : 0) + (duration >= 5 ? 1 : 0) + (fillerWords < 5 ? 0.5 : 0)),
    
    speech_analysis: {
      filler_words: {
        count: fillerWords,
        examples: fillerWords > 0 ? ['Basic analysis detected filler words'] : [],
        impact: fillerWords > 5 ? 'High impact on professionalism' : fillerWords > 2 ? 'Moderate impact' : 'Minimal impact'
      },
      
      speaking_speed: {
        speed: `${estimatedWPM} WPM`,
        assessment: estimatedWPM > 180 ? 'Too Fast' : estimatedWPM < 120 ? 'Too Slow' : 'Appropriate',
        recommendation: estimatedWPM > 180 ? 'Slow down for better clarity' : estimatedWPM < 120 ? 'Speak with more confidence' : 'Maintain current pace'
      },
      
      inclusive_language: {
        issues: 'Automated analysis could not detect specific issues',
        examples: [],
        suggestions: 'Continue being mindful of inclusive language in professional settings'
      },
      
      weak_words: {
        weak_words: weakWords > 0 ? ['Hesitant language detected'] : [],
        strong_alternatives: weakWords > 0 ? ['Use more confident, direct language'] : [],
        professional_impact: weakWords > 3 ? 'Reduced authority and credibility' : 'Minimal impact on professionalism'
      },
      
      repetition: {
        repeated_words: ['Analysis limited in fallback mode'],
        frequency: 'Cannot determine without advanced analysis',
        impact: 'No significant repetition detected'
      },
      
      talk_time: {
        user_speaking_minutes: userSpeakingTime,
        percentage: Math.round((userSpeakingTime / duration) * 100),
        balance_assessment: userSpeakingTime > duration * 0.7 ? 'Talking too much' : userSpeakingTime < duration * 0.3 ? 'Not speaking enough' : 'Appropriate balance',
        recommendation: 'Aim for balanced conversation with active listening'
      }
    },
    
    objectives_analysis: {
      completed: ['Basic conversation engagement'],
      missed: ['Advanced analysis unavailable in fallback mode'],
      evidence: `Completed ${exchanges} exchanges showing basic communication`,
      next_steps: 'Continue practicing to develop more advanced conversation skills'
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
    
    analysis_type: 'fallback-focused-analysis',
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
