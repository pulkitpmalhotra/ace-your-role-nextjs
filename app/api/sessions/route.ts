// app/api/sessions/route.ts - SECURE VERSION with proper auth
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to create authenticated Supabase client
async function createAuthenticatedSupabaseClient(sessionToken: string) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  
  // Verify the JWT token
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const { payload } = await jwtVerify(sessionToken, secret);
  const userEmail = payload.email as string;
  
  if (!userEmail) {
    throw new Error('Invalid session token');
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Set the user context for RLS
  await supabase.rpc('set_config', {
    setting_name: 'app.current_user_email',
    setting_value: userEmail
  });
  
  return { supabase, userEmail };
}

// Alternative: Use service key for specific operations
function createServiceSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_email = searchParams.get('user_email');
    const status = searchParams.get('status');
    
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('📊 GET Sessions API called with auth');

    try {
      // Use authenticated client for user data
      const { supabase, userEmail } = await createAuthenticatedSupabaseClient(sessionToken);
      
      // Verify the requested email matches the authenticated user
      if (user_email && user_email !== userEmail) {
        return Response.json(
          { success: false, error: 'Access denied: can only access your own sessions' },
          { status: 403 }
        );
      }
      
      if (session_id) {
        // Single session query - RLS will ensure user can only see their own
        const { data: session, error } = await supabase
          .from('sessions')
          .select(`
            *,
            scenarios (
              id, title, character_name, character_role, role, difficulty
            )
          `)
          .eq('id', session_id)
          .single();

        if (error) {
          console.error('❌ Single session query error:', error);
          return Response.json(
            { success: false, error: 'Session not found' },
            { status: 404 }
          );
        }

        return Response.json({ success: true, data: session });
      } 
      
      if (user_email) {
        // Multiple sessions query - RLS will filter to user's sessions only
        let query = supabase
          .from('sessions')
          .select(`
            *,
            scenarios (
              id, title, character_name, character_role, role, difficulty
            )
          `);
        
        // Add status filter if provided
        if (status && status !== 'all') {
          query = query.eq('session_status', status);
        }
        
        const { data: sessions, error } = await query
          .order('start_time', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('❌ User sessions query error:', error);
          return Response.json(
            { success: false, error: 'Failed to fetch sessions' },
            { status: 500 }
          );
        }

        console.log('✅ User sessions loaded:', sessions?.length || 0);

        return Response.json({
          success: true,
          data: sessions || [],
          meta: {
            total: sessions?.length || 0,
            user_email: userEmail,
            status_filter: status
          }
        });
      }

      return Response.json(
        { success: false, error: 'Session ID or user email required' },
        { status: 400 }
      );

    } catch (authError) {
      console.error('❌ Authentication error:', authError);
      return Response.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('💥 Sessions GET API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { scenario_id, user_email } = await request.json();
    
    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { supabase, userEmail } = await createAuthenticatedSupabaseClient(sessionToken);
    
    // Verify the requested email matches the authenticated user
    if (user_email !== userEmail) {
      return Response.json(
        { success: false, error: 'Access denied: can only create sessions for yourself' },
        { status: 403 }
      );
    }

    // Use service client for creating sessions (needs elevated permissions)
    const serviceSupabase = createServiceSupabase();
    
    // Get or create user
    let user;
    const { data: existingUser, error: fetchError } = await serviceSupabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      user = existingUser;
    } else if (fetchError?.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await serviceSupabase
        .from('users')
        .insert({
          email: userEmail,
          name: userEmail.split('@')[0],
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
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }
      
      user = newUser;
    } else {
      console.error('❌ Error fetching user:', fetchError);
      return Response.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // Verify scenario exists (scenarios are public)
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('id, title, character_name')
      .eq('id', scenario_id)
      .single();

    if (scenarioError || !scenario) {
      return Response.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Create session using service client
    const { data: session, error: sessionError } = await serviceSupabase
      .from('sessions')
      .insert({
        user_id: user.id,
        scenario_id: scenario_id,
        user_email: userEmail,
        conversation: [],
        session_status: 'active',
        start_time: new Date().toISOString(),
        overall_score: 0,
        duration_minutes: 0
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
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('✅ Session created successfully:', session.id);
    return Response.json({ success: true, data: session });

  } catch (error) {
    console.error('💥 Sessions POST API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { 
      session_id, 
      conversation, 
      session_status, 
      duration_minutes, 
      overall_score, 
      conversation_metadata 
    } = await request.json();
    
    if (!session_id) {
      return Response.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { supabase, userEmail } = await createAuthenticatedSupabaseClient(sessionToken);
    
    // Use service client for updates that need elevated permissions
    const serviceSupabase = createServiceSupabase();
    
    // Get current session to verify ownership
    const { data: currentSession, error: fetchError } = await serviceSupabase
      .from('sessions')
      .select('user_email, session_status, user_id')
      .eq('id', session_id)
      .single();

    if (fetchError || !currentSession) {
      return Response.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (currentSession.user_email !== userEmail) {
      return Response.json(
        { success: false, error: 'Access denied: can only update your own sessions' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (conversation) updateData.conversation = conversation;
    if (session_status) updateData.session_status = session_status;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (overall_score !== undefined) updateData.overall_score = overall_score;
    if (conversation_metadata) updateData.conversation_metadata = conversation_metadata;

    // Update session
    const { data: session, error } = await serviceSupabase
      .from('sessions')
      .update(updateData)
      .eq('id', session_id)
      .select(`
        *,
        scenarios:scenarios(title, character_name, role, difficulty)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    console.log('✅ Session updated successfully:', session_id);
    return Response.json({ success: true, data: session });

  } catch (error) {
    console.error('💥 Sessions PUT API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
