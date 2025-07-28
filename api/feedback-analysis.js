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
    console.log('⚠️ No Gemini API key, using smart mock data');
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

function generateSmartMockFeedback(conversation, scenario) {
  console.log('🎭 Generating smart mock feedback');
  
  // Generate dynamic scores based on conversation length
  const exchanges = conversation.length;
  const baseScore = Math.min(4.5, Math.max(2.0, exchanges * 0.2 + 2.5));
  
  const feedback = {
    categories: {
      opening: {
        score: Math.min(5, Math.round(baseScore + (Math.random() * 0.5 - 0.25))),
        feedback: "Your greeting was professional and you showed good energy. You established initial rapport effectively with the customer.",
        suggestions: ["Try to set a clearer agenda upfront", "Ask more engaging opening questions", "Show more enthusiasm in your voice tone"]
      },
      discovery: {
        score: Math.min(5, Math.round(baseScore - 0.5 + (Math.random() * 0.5))),
        feedback: "You asked some good questions but could have dug deeper into pain points and specific needs of the customer.",
        suggestions: ["Use more open-ended questions", "Listen more actively to responses", "Follow up with 'tell me more about that'"]
      },
      presentation: {
        score: Math.min(5, Math.round(baseScore + (Math.random() * 0.5 - 0.25))),
        feedback: "Good job tailoring your solution presentation and focusing on benefits rather than just features.",
        suggestions: ["Use more specific examples and case studies", "Address potential concerns proactively", "Make the presentation more conversational"]
      },
      objection: {
        score: Math.min(5, Math.round(baseScore - 0.3 + (Math.random() * 0.6))),
        feedback: "You handled objections adequately but could show more confidence and empathy when addressing concerns.",
        suggestions: ["Acknowledge concerns first before responding", "Ask questions to understand objections better", "Use the feel-felt-found technique"]
      },
      closing: {
        score: Math.min(5, Math.round(baseScore + 0.2 + (Math.random() * 0.3))),
        feedback: "Good attempt at defining next steps and seeking some level of commitment from the prospect.",
        suggestions: ["Try trial closes earlier in conversation", "Be more direct in asking for the sale", "Create more urgency around next steps"]
      }
    },
    overall: {
      strengths: [
        "Professional communication style",
        "Good product knowledge demonstration",
        "Clear articulation of ideas",
        "Positive attitude throughout conversation"
      ],
      improvements: [
        "Active listening skills development",
        "Discovery questioning depth",
        "Objection handling confidence",
        "Closing technique timing"
      ],
      nextFocus: `Based on your ${exchanges} exchanges, focus on asking better discovery questions and building more confidence when handling objections. Practice the feel-felt-found technique for your next session.`
    }
  };

  // Calculate overall score
  const categoryScores = Object.values(feedback.categories).map(cat => cat.score);
  feedback.overallScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length * 10) / 10;

  return feedback;
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
