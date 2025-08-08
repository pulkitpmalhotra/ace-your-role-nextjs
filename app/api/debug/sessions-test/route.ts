// app/api/debug/sessions-test/route.ts - Create this file to test sessions API
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');
    
    console.log('🔍 SESSIONS TEST: Testing for user:', user_email);
    
    if (!user_email) {
      return Response.json({
        success: false,
        error: 'user_email parameter required',
        example: '/api/debug/sessions-test?user_email=your@email.com'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({
        success: false,
        error: 'Missing Supabase configuration'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 SESSIONS TEST: Querying sessions...');
    
    // Test 1: Simple count query
    const { data: countData, error: countError, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', user_email);
    
    console.log('🔍 SESSIONS TEST: Count query result:', { count, error: countError });
    
    // Test 2: Simple select without joins
    const { data: simpleData, error: simpleError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_email', user_email)
      .order('start_time', { ascending: false });
    
    console.log('🔍 SESSIONS TEST: Simple query result:', { 
      count: simpleData?.length, 
      error: simpleError,
      firstSession: simpleData?.[0]
    });
    
    // Test 3: Query with join (like the real API)
    const { data: joinData, error: joinError } = await supabase
      .from('sessions')
      .select(`
        *,
        scenarios (
          id,
          title,
          character_name,
          character_role,
          role,
          difficulty
        )
      `)
      .eq('user_email', user_email)
      .order('start_time', { ascending: false });
    
    console.log('🔍 SESSIONS TEST: Join query result:', { 
      count: joinData?.length, 
      error: joinError,
      firstSessionWithJoin: joinData?.[0]
    });
    
    // Test 4: Check if scenarios table is accessible
    const { data: scenariosData, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id, title')
      .limit(3);
    
    console.log('🔍 SESSIONS TEST: Scenarios accessibility:', { 
      count: scenariosData?.length, 
      error: scenariosError
    });
    
    return Response.json({
      success: true,
      debug_results: {
        user_email,
        test_1_count: {
          total_sessions_for_user: count,
          error: countError?.message || null
        },
        test_2_simple_query: {
          sessions_found: simpleData?.length || 0,
          error: simpleError?.message || null,
          sample_session_ids: simpleData?.slice(0, 3).map(s => s.id) || []
        },
        test_3_join_query: {
          sessions_with_scenarios: joinData?.length || 0,
          error: joinError?.message || null,
          sample_data: joinData?.slice(0, 2).map(s => ({
            id: s.id,
            title: s.scenarios?.title || 'NO_SCENARIO',
            session_status: s.session_status,
            start_time: s.start_time
          })) || []
        },
        test_4_scenarios_access: {
          scenarios_accessible: !scenariosError,
          sample_scenarios: scenariosData?.map(s => s.title) || [],
          error: scenariosError?.message || null
        },
        raw_sample: simpleData?.[0] || null
      }
    });

  } catch (error) {
    console.error('💥 SESSIONS TEST: Unexpected error:', error);
    return Response.json({
      success: false,
      error: 'Unexpected error during sessions test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
