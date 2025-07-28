// Replace api/feedback-analysis.js completely with this improved version
import { withAuth } from '../lib/auth.js';

async function handler(req, res) {
  console.log('🔬 Feedback Analysis API called');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

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

    // CRITICAL: Always require real Gemini analysis - NO MORE MOCK DATA
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ No Gemini API key configured');
      return res.status(500).json({
        success: false,
        error: 'AI feedback service not configured. Please contact support.'
      });
    }

    // Validate conversation data
    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid conversation data required for analysis'
      });
    }

    // Generate detailed feedback using ONLY real Gemini analysis
    const detailedFeedback = await generateRealFeedback(conversation, scenario || {});
    
    console.log('✅ Generated real feedback:', detailedFeedback);

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
      error: error.message || 'Failed to analyze feedback',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function generateRealFeedback(conversation, scenario) {
  console.log('🤖 Generating REAL Gemini feedback...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  try {
    // Format conversation for analysis
    const conversationText = conversation
      .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name || 'Customer'}: ${msg.message}`)
      .join('\n');

    if (!conversationText.trim()) {
      throw new Error('No conversation content to analyze');
    }

    const analysisPrompt = `
You are an expert sales trainer with 20+ years of experience. Analyze this roleplay conversation using strict professional standards. Be BRUTALLY HONEST but constructive.

SCENARIO CONTEXT:
- Title: ${scenario.title || 'Sales Practice'}
- Character: ${scenario.character_name || 'Customer'} (${scenario.character_role || 'Potential Client'})
- Character Personality: ${scenario.character_personality || 'Professional contact'}

ACTUAL CONVERSATION:
${conversationText}

SCORING CRITERIA (1-5 scale):
1 = Poor/Unacceptable - Fundamental skills missing, would lose the deal
2 = Below Standard - Significant improvements needed, weak performance  
3 = Acceptable - Meets basic requirements, average performance
4 = Good - Strong performance with minor areas for improvement
5 = Excellent - Exceptional execution, textbook sales technique

EVALUATE EACH CATEGORY WITH BRUTAL HONESTY:

1. OPENING & RAPPORT BUILDING (Weight: 15%)
Analyze: Professional greeting, rapport building, agenda setting, first impression
Look for: Did they introduce themselves professionally? Build natural rapport? Set clear expectations?
Score harshly - most beginners score 1-2 here.

2. DISCOVERY & NEEDS ASSESSMENT (Weight: 30% - MOST CRITICAL)
Analyze: Quality and quantity of questions, pain point identification, qualification
Look for: Open-ended questions, budget qualification, timeline, decision-making process, genuine needs discovery
This is THE most important skill - be extremely critical. Score 3+ only if they asked multiple discovery questions.

3. SOLUTION PRESENTATION (Weight: 25%)
Analyze: Tailoring solution to needs, benefits vs features, compelling presentation
Look for: Did they connect solution to discovered needs? Focus on benefits? Use examples/proof?
Score harshly - generic presentations get 1-2.

4. OBJECTION HANDLING (Weight: 20%)
Analyze: How they handled pushback, concerns, or resistance
Look for: Acknowledgment, clarifying questions, logical responses, relationship maintenance
Most people can't handle objections well - score accordingly.

5. CLOSING & NEXT STEPS (Weight: 10%)
Analyze: Asking for commitment, defining next steps, creating urgency
Look for: Did they ask for the sale/meeting? Clear next steps? Appropriate urgency?
Most people don't close - score 1-2 unless they clearly asked for something.

PROVIDE SPECIFIC EXAMPLES from the conversation to support each score.

FORMAT YOUR RESPONSE EXACTLY AS:
OPENING_SCORE: [1-5]
OPENING_FEEDBACK: [2-3 brutal but constructive sentences with specific examples from conversation]
OPENING_SUGGESTIONS: [3 specific improvements separated by |]

DISCOVERY_SCORE: [1-5]
DISCOVERY_FEEDBACK: [2-3 brutal but constructive sentences with specific examples]
DISCOVERY_SUGGESTIONS: [3 specific improvements separated by |]

PRESENTATION_SCORE: [1-5]
PRESENTATION_FEEDBACK: [2-3 brutal but constructive sentences with specific examples]
PRESENTATION_SUGGESTIONS: [3 specific improvements separated by |]

OBJECTION_SCORE: [1-5]
OBJECTION_FEEDBACK: [2-3 brutal but constructive sentences with specific examples]
OBJECTION_SUGGESTIONS: [3 specific improvements separated by |]

CLOSING_SCORE: [1-5]
CLOSING_FEEDBACK: [2-3 brutal but constructive sentences with specific examples]
CLOSING_SUGGESTIONS: [3 specific improvements separated by |]

OVERALL_STRENGTHS: [Top 2-3 strengths demonstrated separated by |]
OVERALL_IMPROVEMENTS: [Top 3-4 critical areas for improvement separated by |]
NEXT_SESSION_FOCUS: [What to focus on in next practice session - be specific]

Remember: Be tough but fair. Real sales is competitive. Only exceptional performance deserves 4-5 scores.
`;

    console.log('🚀 Calling Gemini API for real analysis...');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent feedback
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid Gemini response:', data);
      throw new Error('Invalid response from AI analysis service');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini response received, parsing...');
    
    return parseAnalysisResponse(analysisText);

  } catch (error) {
    console.error('❌ Real feedback generation failed:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

function parseAnalysisResponse(analysisText) {
  console.log('📝 Parsing real analysis response...');
  
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
      score: scoreMatch ? parseInt(scoreMatch[1]) : 2, // Default to 2 if parsing fails
      feedback: feedbackMatch ? feedbackMatch[1].trim() : "Analysis could not be completed for this section.",
      suggestions: suggestionsMatch ? 
        suggestionsMatch[1].trim().split('|').filter(s => s.trim()).map(s => s.trim()) :
        ["Continue practicing this area", "Focus on fundamental techniques", "Seek additional training"]
    };
  });

  // Parse overall feedback
  const strengthsMatch = analysisText.match(/OVERALL_STRENGTHS: (.+?)(?=\n\w+_|$)/s);
  const improvementsMatch = analysisText.match(/OVERALL_IMPROVEMENTS: (.+?)(?=\n\w+_|$)/s);
  const nextFocusMatch = analysisText.match(/NEXT_SESSION_FOCUS: (.+?)(?=\n\w+_|$)/s);

  feedback.overall = {
    strengths: strengthsMatch ? 
      strengthsMatch[1].trim().split('|').filter(s => s.trim()).map(s => s.trim()) : 
      ["Completed the practice session"],
    improvements: improvementsMatch ? 
      improvementsMatch[1].trim().split('|').filter(s => s.trim()).map(s => s.trim()) : 
      ["Focus on fundamental sales skills", "Practice discovery questions", "Work on closing techniques"],
    nextFocus: nextFocusMatch ? 
      nextFocusMatch[1].trim() : 
      "Continue practicing basic sales fundamentals with focus on discovery questions and closing."
  };

  // Calculate overall score (weighted average)
  const weights = {
    opening: 0.15,
    discovery: 0.30,
    presentation: 0.25,
    objection: 0.20,
    closing: 0.10
  };

  let weightedSum = 0;
  Object.entries(feedback.categories).forEach(([category, data]) => {
    weightedSum += data.score * (weights[category] || 0.2);
  });

  feedback.overallScore = Math.round(weightedSum * 10) / 10; // Round to 1 decimal

  console.log('✅ Parsed real feedback with overall score:', feedback.overallScore);
  
  return feedback;
}

async function storeFeedbackAnalysis(sessionId, feedback) {
  console.log('💾 Storing real feedback analysis in database...');
  
  try {
    // Import Supabase here to avoid issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

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
      throw new Error(`Failed to update session: ${sessionError.message}`);
    } else {
      console.log('✅ Session updated with real feedback');
    }

  } catch (error) {
    console.error('❌ Error in storeFeedbackAnalysis:', error);
    throw new Error(`Database storage failed: ${error.message}`);
  }
}

// Export with authentication
export default withAuth(handler);
