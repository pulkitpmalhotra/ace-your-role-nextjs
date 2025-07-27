// api/sessions/feedback.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing userEmail parameter'
      });
    }

    // Get sessions with detailed feedback
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        scenarios (
          title,
          character_name,
          difficulty
        )
      `)
      .eq('user_email', userEmail)
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Sessions feedback API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sessions with feedback'
    });
  }
}
