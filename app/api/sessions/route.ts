// app/api/sessions/route.ts - Clean Sessions Route
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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
      return Response.json(
        { 
          success: false, 
          error: 'Database configuration missing',
          details: 'Required environment variables not configured'
        },
        { status: 500 }
      );
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
    
    // Ensure user exists
    console.log('👤 Checking/creating user:', user_email);
    
    let user;
    const { data: existingUser, error: fetchError } = await supabaseService
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
      user = existingUser;
    } else {
      const { data: newUser, error: createError } = await supabaseService
        .from('users')
        .insert({
          email: user_email.trim().toLowerCase(),
          name: user_email.split('@')[0],
          total_sessions: 0,
          total_minutes: 0,
          auth_provider: 'google',
          created_at: new Date().toISOString()
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
      
      user = newUser;
    }

    // Verify scenario exists
    const { data: scenario, error: scenarioError } = await supabaseAnon
      .from('scenarios')
      .select('id, title, character_name')
      .eq('id', scenario_id)
      .single();

    if (scenarioError || !scenario) {
      console.error('❌ Scenario not found:', scenario_id);
      return Response.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Create new session
    const { data: session, error: sessionError } = await supabaseService
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

// Update session
export async function PUT(request: Request) {
  try {
    const { session_id, conversation, session_status, duration_minutes, overall_score, conversation_metadata } = await request.json();
    
    if (!session_id) {
      return Response.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const updateData: any = {};
    if (conversation) updateData.conversation = conversation;
    if (session_status) updateData.session_status = session_status;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (overall_score !== undefined) updateData.overall_score = overall_score;
    if (conversation_metadata) updateData.conversation_metadata = conversation_metadata;
    
    updateData.updated_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

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

// Get session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_email = searchParams.get('user_email');
    
    if (!session_id && !user_email) {
      return Response.json(
        { success: false, error: 'Session ID or user email is required' },
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
    
    let query = supabase.from('sessions').select('*');
    
    if (session_id) {
      query = query.eq('id', session_id);
    } else if (user_email) {
      query = query.eq('user_email', user_email).order('created_at', { ascending: false });
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: session_id ? sessions?.[0] : sessions
    });

  } catch (error) {
    console.error('💥 Sessions GET API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
