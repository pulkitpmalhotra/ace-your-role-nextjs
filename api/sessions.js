// Update api/sessions.js
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function handler(req, res) {
  console.log('🚀 Sessions API called');
  console.log('Method:', req.method);
  console.log('User:', req.user?.email);
  console.log('Auth Method:', req.authMethod);

  try {
    if (req.method === 'POST') {
      console.log('📝 Creating new session...');
      const { scenarioId, userEmail } = req.body;

      console.log('📋 Received data:', { scenarioId, userEmail });

      if (!scenarioId) {
        return res.status(400).json({
          success: false,
          error: 'Missing scenarioId',
          received: { scenarioId: !!scenarioId, userEmail: !!userEmail }
        });
      }

      // Use authenticated user's email, fallback to provided email for backward compatibility
      const sessionUserEmail = req.user?.email || userEmail;
      
      if (!sessionUserEmail) {
        return res.status(400).json({
          success: false,
          error: 'User email required'
        });
      }

      console.log('💾 Inserting into database...');
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          scenario_id: scenarioId,
          user_email: sessionUserEmail,
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
        return res.status(400).json({
          success: false,
          error: 'Missing sessionId'
        });
      }

      // Security check: ensure user can only update their own sessions
      const { data: sessionCheck } = await supabase
        .from('sessions')
        .select('user_email')
        .eq('id', sessionId)
        .single();

      if (!sessionCheck) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Allow access if it's the user's session OR legacy auth
      const userEmail = req.user?.email;
      if (userEmail && sessionCheck.user_email !== userEmail) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
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

      // Use authenticated user's email, fallback to query param for backward compatibility
      const queryUserEmail = req.user?.email || userEmail;

      if (!queryUserEmail) {
        console.error('❌ Missing userEmail parameter');
        return res.status(400).json({
          success: false,
          error: 'Missing userEmail parameter'
        });
      }

      console.log('💾 Querying database for user:', queryUserEmail);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          scenarios (
            title,
            character_name,
            difficulty,
            category,
            subcategory
          )
        `)
        .eq('user_email', queryUserEmail)
        .order('start_time', { ascending: false })
        .limit(50); // Add reasonable limit

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

// Export with authentication middleware
export default withAuth(handler, { public: true });
