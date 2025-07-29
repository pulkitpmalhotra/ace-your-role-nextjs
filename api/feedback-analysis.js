// api/feedback-analysis.js - REAL FEEDBACK ONLY
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export default async function handler(req, res) {
  console.log('🔬 Feedback Analysis API called - REAL ANALYSIS ONLY');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  // CORS headers
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

    console.log('🤖 Generating REAL feedback with Gemini...');

    // Generate detailed feedback using ONLY real Gemini analysis
    const detailedFeedback = await generateRealFeedback(conversation, scenario || {}, apiKey);
    
    console.log('✅ Generated real feedback:', detailedFeedback.overallScore);

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

async function generateRealFeedback(conversation, scenario, apiKey) {
  console.log('🤖 Generating REAL Gemini feedback - Enhanced Analysis...');

  try {
    // Format conversation for analysis
    const conversationText = conversation
      .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name || 'Customer'}: ${msg.message}`)
      .join('\n');

    if (!conversationText.trim()) {
      throw new Error('No conversation content to analyze');
    }

    const analysisPrompt = `
GEMINI 2.5 ADVANCED ANALYSIS:
You are an expert sales trainer with 20+ years experience. Analyze this roleplay conversation using advanced reasoning.

THINKING PROCESS:
1. Read the entire conversation for context
2. Identify key sales methodology elements
3. Assess each category with specific evidence
4. Generate actionable improvement recommendations  
5. Predict next session focus areas

ENHANCED SCORING CRITERIA (1-5 scale with 0.1 precision):
- Consider micro-expressions in language
- Evaluate emotional intelligence demonstrated
- Assess adaptability to character responses
- Measure outcome probability

CONVERSATION ANALYSIS:
${conversationText.map(msg => `> ${msg.speaker}: ${msg.message}`).join('\n')}

Provide detailed analysis with specific examples and nuanced scoring.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower for consistency
          maxOutputTokens: 2000, // More detailed feedback
          thinkingBudget: 'medium' // Allow deeper analysis
        }
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
    console.log('✅ Enhanced Gemini response received, parsing...');
    
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
      score: scoreMatch ? parseInt(scoreMatch[1]) : 2,
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

  feedback.overallScore = Math.round(weightedSum * 10) / 10;

  console.log('✅ Parsed real feedback with overall score:', feedback.overallScore);
  
  return feedback;
}

async function storeFeedbackAnalysis(sessionId, feedback) {
  console.log('💾 Storing real feedback analysis in database...');
  
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
      throw new Error(`Failed to update session: ${sessionError.message}`);
    } else {
      console.log('✅ Session updated with real feedback');
    }

  } catch (error) {
    console.error('❌ Error in storeFeedbackAnalysis:', error);
    throw new Error(`Database storage failed: ${error.message}`);
  }
}
