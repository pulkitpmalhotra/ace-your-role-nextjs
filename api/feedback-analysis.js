import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

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

    // Simple mock analysis for now (replace with real Gemini AI later)
    const mockFeedback = {
      overallScore: 3.8,
      categories: {
        opening: {
          score: 4,
          feedback: "Good professional greeting and introduction. You established rapport effectively.",
          suggestions: ["Try to set a clearer agenda", "Show more enthusiasm in your voice"]
        },
        discovery: {
          score: 3,
          feedback: "Asked some good questions but could have dug deeper into pain points.",
          suggestions: ["Use more open-ended questions", "Listen more actively to responses"]
        },
        presentation: {
          score: 4,
          feedback: "Well-tailored solution presentation with good benefit focus.",
          suggestions: ["Use more specific examples", "Address concerns proactively"]
        },
        objection: {
          score: 3,
          feedback: "Handled objections adequately but could show more confidence.",
          suggestions: ["Acknowledge concerns first", "Ask questions to understand better"]
        },
        closing: {
          score: 4,
          feedback: "Clear next steps and good attempt at commitment.",
          suggestions: ["Try trial closes earlier", "Be more direct in asking for the sale"]
        }
      },
      overall: {
        strengths: ["Professional demeanor", "Good product knowledge", "Clear communication"],
        improvements: ["Active listening", "Objection handling confidence", "Discovery depth"],
        nextFocus: "Focus on asking better discovery questions and handling objections with more confidence."
      }
    };

    res.status(200).json({
      success: true,
      data: mockFeedback
    });

  } catch (error) {
    console.error('Feedback analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze feedback'
    });
  }
}
