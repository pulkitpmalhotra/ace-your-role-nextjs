// app/api/sessions/route.ts - FIXED VERSION

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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service key
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    // Use service role key for user operations (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Also create regular client for other operations
    const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
    
    // First, ensure the user exists - CREATE if not exists
    console.log('👤 Checking/creating user:', user_email);
    
    let user;
    
    // Try to get existing user with service client
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
      console.log('✅ Found existing user:', existingUser.email);
      user = existingUser;
    } else {
      console.log('🆕 Creating new user:', user_email);
      
      // Create new user with service client (bypasses RLS)
      const { data: newUser, error: createError } = await supabaseService
        .from('users')
        .insert({
          email: user_email.trim().toLowerCase(),
          name: user_email.split('@')[0],
          total_sessions: 0,
          total_minutes: 0,
          auth_provider: 'google', // Add this
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
      
      console.log('✅ Created new user:', newUser.email);
      user = newUser;
    }

    // Verify scenario exists (can use anon client for this)
    console.log('📋 Verifying scenario exists:', scenario_id);
    const { data: scenario, error: scenarioError } = await supabaseAnon
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

    // Create new session (can use anon client if RLS allows, or service client)
    console.log('🎬 Creating session...');
    const { data: session, error: sessionError } = await supabaseService // Use service client
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

// Keep the existing GET and PUT functions unchanged...
// (Copy the rest of your existing functions here)
