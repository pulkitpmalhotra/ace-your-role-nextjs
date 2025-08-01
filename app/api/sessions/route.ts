// app/api/sessions/route.ts - FIXED VERSION with better error handling

import { createClient } from '@supabase/supabase-js';

// Create a new session
export async function POST(request: Request) {
  try {
    const { scenario_id, user_email } = await request.json();
    
    console.log('🎯 Session creation request:', { scenario_id, user_email });
    
    if (!scenario_id || !user_email) {
      return Response.json(
        { success: false, error: 'Scenario ID and user email are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, ensure the user exists - CREATE if not exists
    console.log('👤 Checking/creating user:', user_email);
    
    let user;
    
    // Try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return Response.json(
        { success: false, error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('✅ Found existing user:', existingUser.email);
      user = existingUser;
    } else {
      console.log('🆕 Creating new user:', user_email);
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: user_email.trim().toLowerCase(),
          name: user_email.split('@')[0],
          total_sessions: 0,
          total_minutes: 0
        })
        .select('id, email')
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return Response.json(
          { success: false, error: `Failed to create user: ${createError.message}` },
          { status: 500 }
        );
      }
      
      console.log('✅ Created new user:', newUser.email);
      user = newUser;
    }

    // Verify scenario exists
    console.log('📋 Verifying scenario exists:', scenario_id);
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('id, title, character_name')
      .eq('id', scenario_id)
      .single();

    if (scenarioError || !scenario) {
      console.error('❌ Scenario not found:', scenario_id, scenarioError);
      return Response.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found scenario:', scenario.title);

    // Create new session
    console.log('🎬 Creating session...');
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        scenario_id: scenario_id,
        user_email: user_email,
        conversation: [],
        session_status: 'active',
        start_time: new Date().toISOString()
      })
      .select(`
        *,
        scenarios:scenarios(*),
        users:users(name, email)
      `)
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return Response.json(
        { success: false, error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Session created successfully:', session.id);

    return Response.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('💥 Sessions POST API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Get user sessions (existing code - no changes needed)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');
    const session_id = searchParams.get('session_id');
    
    if (!user_email && !session_id) {
      return Response.json(
        { success: false, error: 'User email or session ID required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (session_id) {
      // Get specific session
      const { data: session, error } = await supabase
        .from('sessions')
        .select(`
          *,
          scenarios:scenarios(*),
          users:users(name, email)
        `)
        .eq('id', session_id)
        .single();

      if (error) {
        console.error('❌ Error fetching session:', error);
        return Response.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        data: session
      });
    } else {
      // Get user sessions
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          scenarios:scenarios(title, character_name, difficulty, category)
        `)
        .eq('user_email', user_email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching sessions:', error);
        return Response.json(
          { success: false, error: 'Failed to fetch sessions' },
          { status: 500 }
        );
      }

      console.log(`✅ Retrieved ${sessions?.length || 0} sessions for ${user_email}`);

      return Response.json({
        success: true,
        data: sessions || []
      });
    }

  } catch (error) {
    console.error('💥 Sessions GET API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update session (existing code - no changes needed)
export async function PUT(request: Request) {
  try {
    const { session_id, conversation, duration_minutes, overall_score, feedback, session_status } = await request.json();
    
    if (!session_id) {
      return Response.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating session:', session_id);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Prepare update data
    const updateData: any = {};
    
    if (conversation) {
      updateData.conversation = conversation;
      updateData.message_count = conversation.length;
      updateData.user_message_count = conversation.filter((msg: any) => msg.speaker === 'user').length;
      updateData.ai_message_count = conversation.filter((msg: any) => msg.speaker === 'ai').length;
    }
    
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes;
    }
    
    if (overall_score !== undefined) {
      updateData.overall_score = overall_score;
    }
    
    if (feedback) {
      updateData.feedback = feedback;
    }
    
    if (session_status) {
      updateData.session_status = session_status;
      if (session_status === 'completed') {
        updateData.end_time = new Date().toISOString();
      }
    }

    // Update session
    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session_id)
      .select(`
        *,
        scenarios:scenarios(*),
        users:users(name, email)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // If session is completed, update user progress
    if (session_status === 'completed' && session) {
      await updateUserProgress(supabase, session);
    }

    console.log('✅ Session updated:', session_id);

    return Response.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('💥 Sessions PUT API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update user progress (existing code - no changes needed)
async function updateUserProgress(supabase: any, session: any) {
  try {
    const { user_email, scenarios, duration_minutes, overall_score } = session;
    const category = scenarios?.category;

    if (!category) return;

    // Get existing progress
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_email', user_email)
      .eq('category', category)
      .single();

    if (existingProgress) {
      // Update existing progress
      const newTotalSessions = existingProgress.total_sessions + 1;
      const newTotalMinutes = existingProgress.total_minutes + (duration_minutes || 0);
      const newAverageScore = overall_score ? 
        ((existingProgress.average_score * existingProgress.total_sessions) + overall_score) / newTotalSessions :
        existingProgress.average_score;
      const newBestScore = overall_score && overall_score > (existingProgress.best_score || 0) ? 
        overall_score : existingProgress.best_score;

      await supabase
        .from('user_progress')
        .update({
          total_sessions: newTotalSessions,
          total_minutes: newTotalMinutes,
          average_score: newAverageScore,
          best_score: newBestScore,
          last_session_date: new Date().toISOString()
        })
        .eq('user_email', user_email)
        .eq('category', category);
    } else {
      // Create new progress record
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', user_email)
        .single();

      if (user) {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            user_email,
            category,
            total_sessions: 1,
            total_minutes: duration_minutes || 0,
            average_score: overall_score || null,
            best_score: overall_score || null,
            last_session_date: new Date().toISOString()
          });
      }
    }

    // Also update user totals
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_sessions: supabase.raw('total_sessions + 1'),
        total_minutes: supabase.raw(`total_minutes + ${duration_minutes || 0}`)
      })
      .eq('email', user_email);

    if (updateError) {
      console.error('❌ Error updating user totals:', updateError);
    } else {
      console.log('✅ User progress updated for:', user_email, category);
    }

  } catch (error) {
    console.error('❌ Error updating user progress:', error);
  }
}
