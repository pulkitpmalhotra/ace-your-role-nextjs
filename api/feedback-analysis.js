// api/feedback-analysis.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const SALES_RUBRIC = {
  opening: {
    title: "Opening & Rapport Building",
    criteria: [
      "Professional greeting and introduction",
      "Effective rapport building",
      "Clear agenda setting",
      "Appropriate energy and enthusiasm"
    ],
    maxScore: 5
  },
  discovery: {
    title: "Discovery & Needs Assessment", 
    criteria: [
      "Effective questioning techniques",
      "Active listening demonstration",
      "Pain point identification",
      "Qualification of budget/timeline"
    ],
    maxScore: 5
  },
  presentation: {
    title: "Solution Presentation",
    criteria: [
      "Tailoring to discovered needs",
      "Focus on benefits vs features",
      "Use of stories and examples",
      "Clear communication"
    ],
    maxScore: 5
  },
  objectionHandling: {
    title: "Objection Handling",
    criteria: [
      "Acknowledgment of concerns",
      "Questioning to understand",
      "Confident responses",
      "Relationship maintenance"
    ],
    maxScore: 5
  },
  closing: {
    title: "Closing & Next Steps",
    criteria: [
      "Trial close attempts",
      "Clear call to action",
      "Next steps definition",
      "Professional conclusion"
    ],
    maxScore: 5
  }
};

export default async function handler(req, res) {
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

    if (!sessionId || !conversation || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate detailed feedback using AI
    const detailedFeedback = await generateDetailedFeedback(conversation, scenario);
    
    // Store feedback in database
    await storeFeedbackAnalysis(sessionId, detailedFeedback);

    res.status(200).json({
      success: true,
      data: detailedFeedback
    });

  } catch (error) {
    console.error('Feedback analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze feedback'
    });
  }
}

async function generateDetailedFeedback(conversation, scenario) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Format conversation for analysis
  const conversationText = conversation
    .map(msg => `${msg.speaker === 'user' ? 'Salesperson' : scenario.character_name}: ${msg.message}`)
    .join('\n');

  const analysisPrompt = `
Analyze this sales roleplay conversation and provide detailed feedback based on sales best practices.

SCENARIO: ${scenario.title}
CHARACTER: ${scenario.character_name} (${scenario.character_role})

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
OPENING_SUGGESTIONS: [2-3 specific improvement suggestions]

DISCOVERY_SCORE: [1-5]
DISCOVERY_FEEDBACK: [2-3 sentences of specific feedback]
DISCOVERY_SUGGESTIONS: [2-3 specific improvement suggestions]

PRESENTATION_SCORE: [1-5]
PRESENTATION_FEEDBACK: [2-3 sentences of specific feedback]
PRESENTATION_SUGGESTIONS: [2-3 specific improvement suggestions]

OBJECTION_SCORE: [1-5]
OBJECTION_FEEDBACK: [2-3 sentences of specific feedback]
OBJECTION_SUGGESTIONS: [2-3 specific improvement suggestions]

CLOSING_SCORE: [1-5]
CLOSING_FEEDBACK: [2-3 sentences of specific feedback]
CLOSING_SUGGESTIONS: [2-3 specific improvement suggestions]

OVERALL_STRENGTHS: [Top 2-3 strengths demonstrated]
OVERALL_IMPROVEMENTS: [Top 2-3 areas for improvement]
NEXT_SESSION_FOCUS: [What to focus on in next practice session]
`;

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
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const analysisText = data.candidates[0].content.parts[0].text;

  // Parse the structured response
  return parseAnalysisResponse(analysisText);
}

function parseAnalysisResponse(analysisText) {
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
        suggestionsMatch[1].trim().split(/\d+\.|\n-|\n•/).filter(s => s.trim()) :
        ["Continue practicing this skill area."]
    };
  });

  // Parse overall feedback
  const strengthsMatch = analysisText.match(/OVERALL_STRENGTHS: (.+?)(?=\n\w+_|$)/s);
  const improvementsMatch = analysisText.match(/OVERALL_IMPROVEMENTS: (.+?)(?=\n\w+_|$)/s);
  const nextFocusMatch = analysisText.match(/NEXT_SESSION_FOCUS: (.+?)(?=\n\w+_|$)/s);

  feedback.overall = {
    strengths: strengthsMatch ? strengthsMatch[1].trim().split(/\d+\.|\n-|\n•/).filter(s => s.trim()) : [],
    improvements: improvementsMatch ? improvementsMatch[1].trim().split(/\d+\.|\n-|\n•/).filter(s => s.trim()) : [],
    nextFocus: nextFocusMatch ? nextFocusMatch[1].trim() : "Continue practicing various sales skills."
  };

  // Calculate overall score
  const categoryScores = Object.values(feedback.categories).map(cat => cat.score);
  feedback.overallScore = Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length * 10) / 10;

  return feedback;
}

async function storeFeedbackAnalysis(sessionId, feedback) {
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

  const { error } = await supabase
    .from('session_feedback')
    .insert(feedbackRecords);

  if (error) {
    console.error('Error storing feedback:', error);
    // Don't throw error - we can still return feedback even if storage fails
  }

  // Update session with overall score
  await supabase
    .from('sessions')
    .update({ 
      overall_score: feedback.overallScore,
      detailed_feedback: JSON.stringify(feedback)
    })
    .eq('id', sessionId);
}
