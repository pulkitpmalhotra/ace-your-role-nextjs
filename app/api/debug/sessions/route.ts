// app/api/debug/sessions/route.ts - Create this file to test Supabase connection
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');
    
    console.log('🔍 DEBUG: Testing Supabase connection for:', user_email);
    
    if (!user_email) {
      return Response.json({
        success: false,
        error: 'user_email parameter required',
        example: '/api/debug/sessions?user_email=your@email.com'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔍 DEBUG: Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({
        success: false,
        error: 'Supabase configuration missing',
        config: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseKey: supabaseKey ? 'Set' : 'Missing'
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check if sessions table exists and count total sessions
    console.log('🔍 DEBUG: Testing sessions table access...');
    const { data: allSessions, error: allError, count: totalCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (allError) {
      console.error('❌ DEBUG: Error accessing sessions table:', allError);
      return Response.json({
        success: false,
        error: 'Cannot access sessions table',
        details: allError
      });
    }

    console.log('✅ DEBUG: Sessions table accessible, total sessions:', totalCount);

    // Test 2: Check sessions for specific user
    console.log('🔍 DEBUG: Querying sessions for user:', user_email);
    const { data: userSessions, error: userError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_email,
        session_status,
        start_time,
        duration_minutes,
        overall_score,
        scenarios (
          id,
          title,
          character_name,
          role
        )
      `)
      .eq('user_email', user_email)
      .order('start_time', { ascending: false });

    if (userError) {
      console.error('❌ DEBUG: Error querying user sessions:', userError);
      return Response.json({
        success: false,
        error: 'Error querying user sessions',
        details: userError
      });
    }

    console.log('✅ DEBUG: User sessions found:', userSessions?.length || 0);

    // Test 3: Check scenarios table
    console.log('🔍 DEBUG: Testing scenarios table...');
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id, title')
      .limit(5);

    if (scenariosError) {
      console.error('❌ DEBUG: Error accessing scenarios table:', scenariosError);
    }

    // Test 4: Check users table
    console.log('🔍 DEBUG: Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (usersError && usersError.code !== 'PGRST116') {
      console.error('❌ DEBUG: Error accessing users table:', usersError);
    }

    return Response.json({
      success: true,
      debug_info: {
        user_email: user_email,
        total_sessions_in_db: totalCount,
        user_sessions_found: userSessions?.length || 0,
        scenarios_accessible: !scenariosError,
        user_found: !usersError,
        sample_user_session: userSessions?.[0] || null,
        sample_sessions_structure: userSessions?.slice(0, 2) || [],
        environment: {
          supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
          supabaseKey: supabaseKey ? 'Present' : 'Missing',
          timestamp: new Date().toISOString()
        }
      },
      raw_data: {
        userSessions: userSessions || [],
        scenarios: scenarios?.slice(0, 3) || [],
        user: users || null
      }
    });

  } catch (error) {
    console.error('💥 DEBUG: Unexpected error:', error);
    return Response.json({
      success: false,
      error: 'Unexpected error during debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
