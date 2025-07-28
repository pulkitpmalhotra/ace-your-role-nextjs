// api/feedback-analysis.js - COMPLETE FILE WITH IMPROVED SCORING

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export default async function handler(req, res) {
  console.log('🔬 Feedback Analysis API called');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, conversation, scenario } = req.body;

    console.log('📋 Received data:', { 
      sessionId, 
      conversationLength: conversation?.length, 
      scenarioTitle: scenario?.title 
    });

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId'
      });
    }

    // Generate detailed feedback
    const detailedFeedback = await generateDetailedFeedback(conversation || [], scenario || {});
    
    console.log('✅ Generated feedback:', detailedFeedback);

    // Store feedback in database
    await storeFeedbackAnalysis(sessionId, detailedFeedback);

    console.log('✅ Feedback stored successfully');

    res.status(200).json({
      success: true,
      data: detailedFeedback
    });

  } catch (error) {
    console.error('❌ Feedback analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze feedback'
    });
  }
}

async function generateDetailedFeedback(conversation, scenario) {
  console.log('🤖 Generating detailed feedback...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  // If no Gemini API key, use smart mock data
  if (!apiKey) {
    console.log('⚠️ No Gemini API key, using improved mock data');
    return generateSmartMockFeedback(conversation, scenario);
  }

  try {
    // Format conversation for analysis
    const conversationText = conversation
      .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name || 'Customer'}: ${msg.message}`)
      .join('\n');

    if (!conversationText.trim()) {
      console.log('⚠️ No conversation data, using mock feedback');
      return generateSmartMockFeedback(conversation, scenario);
    }

    const analysisPrompt = `
Analyze this sales roleplay conversation and provide detailed feedback based on sales best practices.

SCENARIO: ${scenario.title || 'Sales Practice'}
CHARACTER: ${scenario.character_name || 'Customer'} (${scenario.character_role || 'Potential Client'})

CONVERSATION:
${conversationText}

Please evaluate the salesperson's performance in these categories (score 1-5, where 5 is excellent):

1. OPENING & RAPPORT BUILDING (1-5):
   - Professional greeting and introduction
   - Effective rapport building techniques
   - Clear agenda setting
   - Appropriate energy and enthusiasm
   
2. DISCOVERY & NEEDS ASSESSMENT (1-5):
   - Quality of questions asked (open vs closed)
   - Demonstration of active listening
   - Identification of pain points/needs
   - Qualification of budget, timeline, decision-making
   
3. SOLUTION PRESENTATION (1-5):
   - Tailoring solution to discovered needs
   - Focus on benefits rather than features
   - Use of stories, examples, or case studies
   - Clear and compelling communication
   
4. OBJECTION HANDLING (1-5):
   - Acknowledgment and empathy for concerns
   - Questioning to understand objections fully
   - Confident and logical responses
   - Maintaining positive relationship
   
5. CLOSING & NEXT STEPS (1-5):
   - Attempts at trial closes
   - Clear ask for the sale or commitment
   - Definition of clear next steps
   - Professional and positive conclusion

FORMAT YOUR RESPONSE EXACTLY AS:
OPENING_SCORE: [1-5]
OPENING_FEEDBACK: [2-3 sentences of specific feedback]
OPENING_SUGGESTIONS: [2-3 specific improvement suggestions separated by |]

DISCOVERY_SCORE: [1-5]
DISCOVERY_FEEDBACK: [2-3 sentences of specific feedback]
DISCOVERY_SUGGESTIONS: [2-3 specific improvement suggestions separated by |]

PRESENTATION_SCORE: [1-5]
PRESENTATION_FEEDBACK: [2-3 sentences of specific feedback]
PRESENTATION_SUGGESTIONS: [2-3 specific improvement suggestions separated by |]

OBJECTION_SCORE: [1-5]
OBJECTION_FEEDBACK: [2-3 sentences of specific feedback]
OBJECTION_SUGGESTIONS: [2-3 specific improvement suggestions separated by |]

CLOSING_SCORE: [1-5]
CLOSING_FEEDBACK: [2-3 sentences of specific feedback]
CLOSING_SUGGESTIONS: [2-3 specific improvement suggestions separated by |]

OVERALL_STRENGTHS: [Top 2-3 strengths demonstrated separated by |]
OVERALL_IMPROVEMENTS: [Top 2-3 areas for improvement separated by |]
NEXT_SESSION_FOCUS: [What to focus on in next practice session]
`;

    console.log('🚀 Calling Gemini API...');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status);
      return generateSmartMockFeedback(conversation, scenario);
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;

    console.log('✅ Gemini response received');
    return parseAnalysisResponse(analysisText);

  } catch (error) {
    console.error('❌ Gemini API failed:', error);
    return generateSmartMockFeedback(conversation, scenario);
  }
}

// BRUTAL SCORING SYSTEM - Replace generateSmartMockFeedback function in api/feedback-analysis.js

function generateSmartMockFeedback(conversation, scenario) {
  console.log('🎭 Generating BRUTAL realistic feedback based on conversation analysis');
  
  const exchanges = conversation.length;
  const totalWords = conversation.reduce((total, msg) => {
    return total + (msg.message ? msg.message.split(' ').length : 0);
  }, 0);
  
  const avgWordsPerMessage = exchanges > 0 ? totalWords / exchanges : 0;
  const sessionDuration = conversation.length > 1 ? 
    (conversation[conversation.length - 1].timestamp - conversation[0].timestamp) / 60000 : 1;

  // Analyze conversation quality indicators
  const qualityMetrics = analyzeConversationQuality(conversation);
  
  // BRUTAL BASE SCORING - Most people start low
  let baseScore = 1.5; // Start very low
  
  // Only increase if they meet specific criteria
  if (exchanges >= 3) baseScore += 0.3; // Basic engagement
  if (exchanges >= 6) baseScore += 0.4; // Good engagement  
  if (exchanges >= 10) baseScore += 0.5; // Excellent engagement
  if (exchanges >= 15) baseScore += 0.3; // Exceptional engagement
  
  // Word depth matters a lot
  if (avgWordsPerMessage >= 8) baseScore += 0.2;
  if (avgWordsPerMessage >= 12) baseScore += 0.3;
  if (avgWordsPerMessage >= 18) baseScore += 0.4;
  if (avgWordsPerMessage >= 25) baseScore += 0.3;
  
  // Duration penalty for rushed conversations
  if (sessionDuration < 2) baseScore -= 0.4;
  if (sessionDuration < 1) baseScore -= 0.6;
  
  // Cap the base score - no one gets high scores easily
  baseScore = Math.min(3.2, baseScore);
  
  console.log('📊 BRUTAL Scoring factors:', {
    exchanges,
    avgWordsPerMessage: Math.round(avgWordsPerMessage),
    sessionDuration: Math.round(sessionDuration),
    bruttalBaseScore: Math.round(baseScore * 10) / 10,
    qualityBonus: Math.round(qualityMetrics.overall * 10) / 10
  });

  // Apply quality metrics with harsh penalties
  const finalBaseScore = Math.max(1.0, baseScore + (qualityMetrics.overall - 2.5) * 0.3);

  // Generate category-specific scores with BRUTAL variations
  const feedback = {
    categories: {
      opening: {
        score: calculateBrutalScore(finalBaseScore, qualityMetrics.opening, 'opening'),
        feedback: generateOpeningFeedback(qualityMetrics.opening, exchanges, true),
        suggestions: getOpeningSuggestions(qualityMetrics.opening, true)
      },
      discovery: {
        score: calculateBrutalScore(finalBaseScore - 0.5, qualityMetrics.discovery, 'discovery'), // Discovery is hardest
        feedback: generateDiscoveryFeedback(qualityMetrics.discovery, avgWordsPerMessage, true),
        suggestions: getDiscoverySuggestions(qualityMetrics.discovery, true)
      },
      presentation: {
        score: calculateBrutalScore(finalBaseScore - 0.2, qualityMetrics.presentation, 'presentation'),
        feedback: generatePresentationFeedback(qualityMetrics.presentation, totalWords, true),
        suggestions: getPresentationSuggestions(qualityMetrics.presentation, true)
      },
      objection: {
        score: calculateBrutalScore(finalBaseScore - 0.8, qualityMetrics.objection, 'objection'), // Very hard without practice
        feedback: generateObjectionFeedback(qualityMetrics.objection, exchanges, true),
        suggestions: getObjectionSuggestions(qualityMetrics.objection, true)
      },
      closing: {
        score: calculateBrutalScore(finalBaseScore - 0.6, qualityMetrics.closing, 'closing'), // Hard to close well
        feedback: generateClosingFeedback(qualityMetrics.closing, sessionDuration, true),
        suggestions: getClosingSuggestions(qualityMetrics.closing, true)
      }
    },
    overall: {
      strengths: generateStrengths(qualityMetrics, exchanges, avgWordsPerMessage, true),
      improvements: generateImprovements(qualityMetrics, exchanges, true),
      nextFocus: generateNextFocus(qualityMetrics, exchanges, scenario, true)
    }
  };

  // Calculate overall score with harsh reality
  const categoryScores = Object.values(feedback.categories).map(cat => cat.score);
  feedback.overallScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length * 10) / 10;

  console.log('✅ Generated BRUTAL feedback with overall score:', feedback.overallScore);
  console.log('📊 Category scores:', categoryScores);
  
  return feedback;
}

function calculateBrutalScore(baseScore, qualityBonus, category) {
  let score = baseScore + qualityBonus;
  
  // Category-specific harsh caps
  const categoryCaps = {
    opening: 4.2,     // Opening can be decent
    discovery: 3.8,   // Discovery is very hard  
    presentation: 4.0, // Presentation takes skill
    objection: 3.2,   // Objection handling is expert-level
    closing: 3.5      // Closing is difficult
  };
  
  score = Math.min(categoryCaps[category] || 4.0, score);
  score = Math.max(1.0, score); // Never below 1
  
  return Math.round(score * 10) / 10;
}

function analyzeConversationQuality(conversation) {
  const userMessages = conversation.filter(msg => msg.speaker === 'user');
  
  if (userMessages.length === 0) {
    return {
      overall: 1.0, // Terrible if no user messages
      opening: -1.0,
      discovery: -1.0,
      presentation: -1.0,
      objection: -1.0,
      closing: -1.0
    };
  }
  
  const qualityIndicators = {
    questions: 0,
    openQuestions: 0,
    greetings: 0,
    benefits: 0,
    features: 0,
    objectionHandling: 0,
    closing: 0,
    rapport: 0,
    discovery: 0,
    assumptiveClose: 0
  };

  userMessages.forEach(msg => {
    const text = (msg.message || '').toLowerCase();
    
    // Count ALL questions
    const questionCount = (text.match(/\?/g) || []).length;
    qualityIndicators.questions += questionCount;
    
    // Count OPEN questions (much better)
    if (text.includes('what') || text.includes('how') || text.includes('why') || text.includes('tell me about')) {
      qualityIndicators.openQuestions++;
    }
    
    // Greetings and rapport
    if (text.includes('hello') || text.includes('hi') || text.includes('good morning') || text.includes('nice to meet') || text.includes('how are you')) {
      qualityIndicators.greetings++;
    }
    
    if (text.includes('thank you') || text.includes('appreciate') || text.includes('understand')) {
      qualityIndicators.rapport++;
    }
    
    // Benefits vs Features (benefits are better)
    if (text.includes('benefit') || text.includes('help') || text.includes('save') || text.includes('improve') || text.includes('increase') || text.includes('reduce costs') || text.includes('efficiency')) {
      qualityIndicators.benefits++;
    }
    
    if (text.includes('feature') || text.includes('includes') || text.includes('has') || text.includes('contains')) {
      qualityIndicators.features++;
    }
    
    // Discovery language
    if (text.includes('challenge') || text.includes('problem') || text.includes('current') || text.includes('process') || text.includes('goal') || text.includes('priority')) {
      qualityIndicators.discovery++;
    }
    
    // Objection handling
    if (text.includes('understand your concern') || text.includes('i see') || text.includes('that makes sense') || text.includes('let me address')) {
      qualityIndicators.objectionHandling++;
    }
    
    // Closing language
    if (text.includes('next step') || text.includes('move forward') || text.includes('schedule') || text.includes('sign up') || text.includes('start') || text.includes('when would') || text.includes('ready to')) {
      qualityIndicators.closing++;
    }
    
    // Assumptive closes (advanced)
    if (text.includes('when we') || text.includes('after we implement') || text.includes('once you start')) {
      qualityIndicators.assumptiveClose++;
    }
  });

  const totalMessages = userMessages.length;
  
  // BRUTAL quality calculations
  const qualityScores = {
    opening: qualityIndicators.greetings > 0 ? 
      (qualityIndicators.rapport > 0 ? 0.5 : 0.2) : -0.8, // Harsh penalty for no greeting
    
    discovery: qualityIndicators.openQuestions >= 2 ? 0.6 :
               qualityIndicators.openQuestions >= 1 ? 0.2 :
               qualityIndicators.questions >= 2 ? 0.1 : -0.9, // Very harsh on discovery
    
    presentation: qualityIndicators.benefits >= 2 ? 0.4 :
                  qualityIndicators.benefits >= 1 ? 0.2 :
                  qualityIndicators.features > qualityIndicators.benefits ? -0.3 : -0.5,
    
    objection: qualityIndicators.objectionHandling >= 1 ? 0.3 : -0.8, // Most people can't handle objections
    
    closing: qualityIndicators.assumptiveClose >= 1 ? 0.6 :
             qualityIndicators.closing >= 1 ? 0.3 : -0.7 // Most people don't close
  };
  
  // Overall quality is harsh average
  const qualityValues = Object.values(qualityScores);
  const avgQuality = qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length;
  
  return {
    overall: Math.max(1.0, 2.0 + avgQuality), // Harsh overall scoring
    opening: qualityScores.opening,
    discovery: qualityScores.discovery,
    presentation: qualityScores.presentation,
    objection: qualityScores.objection,
    closing: qualityScores.closing
  };
}

// BRUTAL feedback generation
function generateOpeningFeedback(score, exchanges, brutal = false) {
  if (!brutal) return generateOpeningFeedback(score, exchanges, false);
  
  if (score > 0.3) {
    return "Solid opening with good rapport building. You established a professional tone and showed genuine interest in the prospect.";
  } else if (score > 0) {
    return "Basic opening but lacks warmth and engagement. Your greeting was adequate but didn't create strong initial rapport.";
  } else {
    return "Poor opening that immediately puts you at a disadvantage. You failed to establish rapport or set a professional tone.";
  }
}

function getOpeningSuggestions(score, brutal = false) {
  if (!brutal) return getOpeningSuggestions(score, false);
  
  const harsh = [
    "Your opening is critical - practice until it's natural",
    "Ask 'How are you?' and actually listen to the answer",
    "Set agenda: 'I'd like to learn about your business first'"
  ];
  
  if (score <= 0) {
    harsh.push("Study successful sales openers", "Record yourself and improve tone");
  }
  
  return harsh.slice(0, 3);
}

function generateDiscoveryFeedback(score, avgWords, brutal = false) {
  if (!brutal) return generateDiscoveryFeedback(score, avgWords, false);
  
  if (score > 0.4) {
    return "Excellent discovery work! You asked the right questions and uncovered real business needs. This is professional-level selling.";
  } else if (score > 0) {
    return "Weak discovery that missed critical information. You asked some questions but failed to uncover real pain points or needs.";
  } else {
    return "Terrible discovery - you're essentially selling blind. You didn't ask meaningful questions and don't understand their business.";
  }
}

function getDiscoverySuggestions(score, brutal = false) {
  if (!brutal) return getDiscoverySuggestions(score, false);
  
  const harsh = [
    "You MUST ask 'what' and 'how' questions - features don't matter without needs",
    "Dig deeper: 'Tell me more about that challenge'",
    "Find pain: 'What's the cost of not solving this?'"
  ];
  
  if (score <= 0) {
    harsh.push("Learn SPIN selling immediately", "Practice discovery with every conversation");
  }
  
  return harsh.slice(0, 3);
}

function generatePresentationFeedback(score, totalWords, brutal = false) {
  if (!brutal) return generatePresentationFeedback(score, totalWords, false);
  
  if (score > 0.3) {
    return "Good presentation focused on benefits. You connected your solution to their specific needs effectively.";
  } else if (score > 0) {
    return "Mediocre presentation that focused too much on features. You didn't clearly connect benefits to their discovered needs.";
  } else {
    return "Poor presentation that will not persuade anyone. You're talking about features without showing value or relevance.";
  }
}

function getPresentationSuggestions(score, brutal = false) {
  if (!brutal) return getPresentationSuggestions(score, false);
  
  const harsh = [
    "Stop talking features - only discuss benefits that solve their problems",
    "Use this formula: 'Because you mentioned X, our Y will Z'",
    "Every feature must answer 'So what?' from their perspective"
  ];
  
  return harsh.slice(0, 3);
}

function generateObjectionFeedback(score, exchanges, brutal = false) {
  if (!brutal) return generateObjectionFeedback(score, exchanges, false);
  
  if (score > 0.1) {
    return "Decent objection handling with empathy and logic. You addressed concerns while maintaining the relationship.";
  } else {
    return "Failed to handle objections professionally. You either avoided them, got defensive, or provided weak responses.";
  }
}

function getObjectionSuggestions(score, brutal = false) {
  if (!brutal) return getObjectionSuggestions(score, false);
  
  return [
    "Never argue - always say 'I understand that concern'",
    "Ask: 'Help me understand what you mean by that'",
    "Use feel-felt-found: 'Others felt that way, found this solution worked'"
  ];
}

function generateClosingFeedback(score, duration, brutal = false) {
  if (!brutal) return generateClosingFeedback(score, duration, false);
  
  if (score > 0.2) {
    return "Good closing attempt with clear next steps. You asked for commitment and created momentum forward.";
  } else {
    return "Weak or absent closing that wastes the entire conversation. You didn't ask for anything or define next steps.";
  }
}

function getClosingSuggestions(score, brutal = false) {
  if (!brutal) return getClosingSuggestions(score, false);
  
  return [
    "Always ask for something: meeting, demo, proposal, or sale",
    "Use assumptive language: 'When shall we start?'",
    "Create urgency: 'What would prevent us from moving forward?'"
  ];
}

function generateStrengths(metrics, exchanges, avgWords, brutal = false) {
  if (!brutal) return generateStrengths(metrics, exchanges, avgWords, false);
  
  const strengths = [];
  
  // Be VERY selective about strengths
  if (exchanges >= 12) strengths.push("Strong conversation stamina");
  if (avgWords >= 20) strengths.push("Thoughtful, detailed responses");
  if (metrics.discovery > 0.4) strengths.push("Solid discovery questioning");
  if (metrics.presentation > 0.3) strengths.push("Benefit-focused communication");
  if (metrics.opening > 0.3) strengths.push("Professional rapport building");
  if (metrics.closing > 0.2) strengths.push("Closing confidence");
  
  // If no real strengths, give participation awards
  if (strengths.length === 0) {
    strengths.push("Completed the session", "Willing to practice");
  }
  
  return strengths.slice(0, 3);
}

function generateImprovements(metrics, exchanges, brutal = false) {
  if (!brutal) return generateImprovements(metrics, exchanges, false);
  
  const improvements = [];
  
  // Be harsh about what needs work
  if (metrics.discovery <= 0.2) improvements.push("Discovery questioning is terrible - you're selling blind");
  if (metrics.objection <= 0) improvements.push("Objection handling is non-existent - you'll lose every deal");
  if (metrics.closing <= 0) improvements.push("Closing is pathetic - you're wasting prospects' time");
  if (exchanges < 8) improvements.push("Conversation engagement too short - shows lack of interest");
  if (metrics.presentation <= 0.1) improvements.push("Presentation is feature-dumping, not selling");
  if (metrics.opening <= 0) improvements.push("Opening fails to build any rapport");
  
  return improvements.slice(0, 4);
}

function generateNextFocus(metrics, exchanges, scenario, brutal = false) {
  if (!brutal) return generateNextFocus(metrics, exchanges, scenario, false);
  
  // Find the WORST area and focus there
  const scores = {
    discovery: metrics.discovery,
    objection: metrics.objection,
    closing: metrics.closing,
    presentation: metrics.presentation,
    opening: metrics.opening
  };
  
  const worstArea = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
  
  const focusMap = {
    discovery: "Your discovery is terrible. Learn SPIN selling and practice asking 'what' and 'how' questions until it's natural.",
    objection: "You can't handle objections. Study feel-felt-found technique and practice acknowledging concerns first.",
    closing: "You don't know how to close. Every conversation must end with asking for something specific.",
    presentation: "You're feature-dumping instead of selling. Focus on benefits that solve their specific problems.",
    opening: "Your openings are unprofessional. Practice rapport building and agenda setting."
  };
  
  return focusMap[worstArea] + ` This is your biggest weakness and will kill deals.`;
}
function parseAnalysisResponse(analysisText) {
  console.log('📝 Parsing analysis response...');
  
  const feedback = {
    categories: {},
    overall: {}
  };

  const categories = ['OPENING', 'DISCOVERY', 'PRESENTATION', 'OBJECTION', 'CLOSING'];
  
  categories.forEach(category => {
    const scoreMatch = analysisText.match(new RegExp(`${category}_SCORE: (\\d+)`));
    const feedbackMatch = analysisText.match(new RegExp(`${category}_FEEDBACK: (.+?)(?=\\n\\w+_|$)`, 's'));
    const suggestionsMatch = analysisText.match(new RegExp(`${category}_SUGGESTIONS: (.+?)(?=\\n\\w+_|$)`, 's'));
    
    feedback.categories[category.toLowerCase()] = {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 3,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : "No specific feedback available.",
      suggestions: suggestionsMatch ? 
        suggestionsMatch[1].trim().split('|').filter(s => s.trim()) :
        ["Continue practicing this skill area."]
    };
  });

  // Parse overall feedback
  const strengthsMatch = analysisText.match(/OVERALL_STRENGTHS: (.+?)(?=\n\w+_|$)/s);
  const improvementsMatch = analysisText.match(/OVERALL_IMPROVEMENTS: (.+?)(?=\n\w+_|$)/s);
  const nextFocusMatch = analysisText.match(/NEXT_SESSION_FOCUS: (.+?)(?=\n\w+_|$)/s);

  feedback.overall = {
    strengths: strengthsMatch ? strengthsMatch[1].trim().split('|').filter(s => s.trim()) : [],
    improvements: improvementsMatch ? improvementsMatch[1].trim().split('|').filter(s => s.trim()) : [],
    nextFocus: nextFocusMatch ? nextFocusMatch[1].trim() : "Continue practicing various sales skills."
  };

  // Calculate overall score
  const categoryScores = Object.values(feedback.categories).map(cat => cat.score);
  feedback.overallScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length * 10) / 10;

  return feedback;
}

async function storeFeedbackAnalysis(sessionId, feedback) {
  console.log('💾 Storing feedback analysis in database...');
  
  try {
    // Store detailed feedback in database
    const feedbackRecords = [];
    
    Object.entries(feedback.categories).forEach(([category, data]) => {
      feedbackRecords.push({
        session_id: sessionId,
        category: category,
        score: data.score,
        feedback_text: data.feedback,
        suggestions: data.suggestions,
        max_score: 5
      });
    });

    console.log('📝 Inserting feedback records:', feedbackRecords.length);

    const { error: feedbackError } = await supabase
      .from('session_feedback')
      .insert(feedbackRecords);

    if (feedbackError) {
      console.error('❌ Error storing category feedback:', feedbackError);
    } else {
      console.log('✅ Category feedback stored successfully');
    }

    // Update session with overall score and detailed feedback
    console.log('📝 Updating session with overall feedback...');
    
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        overall_score: feedback.overallScore,
        detailed_feedback: JSON.stringify(feedback)
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('❌ Error updating session:', sessionError);
    } else {
      console.log('✅ Session updated with feedback');
    }

  } catch (error) {
    console.error('❌ Error in storeFeedbackAnalysis:', error);
    // Don't throw error - we can still return feedback even if storage fails
  }
}
