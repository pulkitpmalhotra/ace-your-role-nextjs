// api/sessions.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Create new session
      const { scenarioId, userEmail } = req.body;

      if (!scenarioId || !userEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing scenarioId or userEmail'
        });
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          scenario_id: scenarioId,
          user_email: userEmail,
          conversation: [],
          duration_minutes: 0
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        data: { sessionId: data.id }
      });

    } else if (req.method === 'PUT') {
      // Update session
      const { sessionId, conversation, feedback, durationMinutes, endSession } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing sessionId'
        });
      }

      let updateData = {};

      if (conversation) {
        updateData.conversation = conversation;
      }

      if (endSession) {
        updateData.end_time = new Date().toISOString();
        if (feedback) updateData.feedback = feedback;
        if (durationMinutes) updateData.duration_minutes = durationMinutes;
      }

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to update session: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: { message: 'Session updated successfully' }
      });

    } else if (req.method === 'GET') {
      // Get sessions for user
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing userEmail parameter'
        });
      }

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
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: data || []
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Sessions API error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
}
