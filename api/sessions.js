import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('🚀 Sessions API called');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS handled');
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      console.log('📝 Creating new session...');
      const { scenarioId, userEmail } = req.body;

      console.log('📋 Received data:', { scenarioId, userEmail });

      if (!scenarioId || !userEmail) {
        console.error('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing scenarioId or userEmail',
          received: { scenarioId: !!scenarioId, userEmail: !!userEmail }
        });
      }

      console.log('💾 Inserting into database...');
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
        console.error('❌ Database error:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      console.log('✅ Session created:', data);
      res.status(201).json({
        success: true,
        data: { sessionId: data.id }
      });

    } else if (req.method === 'PUT') {
      console.log('📝 Updating session...');
      const { sessionId, conversation, feedback, durationMinutes, endSession } = req.body;

      console.log('📋 Received data:', { 
        sessionId, 
        conversationLength: conversation?.length, 
        feedback, 
        durationMinutes, 
        endSession 
      });

      if (!sessionId) {
        console.error('❌ Missing sessionId');
        return res.status(400).json({
          success: false,
          error: 'Missing sessionId'
        });
      }

      let updateData = {};

      if (conversation !== undefined) {
        console.log('💬 Updating conversation...');
        
        // Validate conversation format
        if (!Array.isArray(conversation)) {
          console.error('❌ Conversation is not an array:', typeof conversation);
          return res.status(400).json({
            success: false,
            error: 'Conversation must be an array',
            receivedType: typeof conversation
          });
        }

        // Validate each message
        for (let i = 0; i < conversation.length; i++) {
          const msg = conversation[i];
          if (!msg || typeof msg !== 'object') {
            console.error(`❌ Invalid message at index ${i}:`, msg);
            return res.status(400).json({
              success: false,
              error: `Invalid message format at index ${i}`,
              message: msg
            });
          }
          
          if (!msg.speaker || !msg.message || !msg.timestamp) {
            console.error(`❌ Missing required fields in message ${i}:`, msg);
            return res.status(400).json({
              success: false,
              error: `Missing required fields in message ${i}`,
              message: msg,
              requiredFields: ['speaker', 'message', 'timestamp']
            });
          }

          if (!['user', 'ai'].includes(msg.speaker)) {
            console.error(`❌ Invalid speaker in message ${i}:`, msg.speaker);
            return res.status(400).json({
              success: false,
              error: `Invalid speaker "${msg.speaker}" in message ${i}`,
              validSpeakers: ['user', 'ai']
            });
          }
        }

        updateData.conversation = conversation;
        console.log('✅ Conversation validated');
      }

      if (endSession) {
        console.log('🏁 Ending session...');
        updateData.end_time = new Date().toISOString();
        if (feedback) updateData.feedback = feedback;
        if (durationMinutes) updateData.duration_minutes = durationMinutes;
      }

      console.log('💾 Updating database with:', Object.keys(updateData));
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('❌ Database update error:', error);
        throw new Error(`Failed to update session: ${error.message}`);
      }

      console.log('✅ Session updated successfully');
      res.status(200).json({
        success: true,
        data: { message: 'Session updated successfully' }
      });

    } else if (req.method === 'GET') {
      console.log('📋 Fetching user sessions...');
      const { userEmail } = req.query;

      if (!userEmail) {
        console.error('❌ Missing userEmail parameter');
        return res.status(400).json({
          success: false,
          error: 'Missing userEmail parameter'
        });
      }

      console.log('💾 Querying database for user:', userEmail);
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
        console.error('❌ Database query error:', error);
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      console.log(`✅ Found ${data?.length || 0} sessions`);
      res.status(200).json({
        success: true,
        data: data || []
      });

    } else {
      console.error('❌ Method not allowed:', req.method);
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS']
      });
    }
  } catch (error) {
    console.error('💥 Sessions API error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
