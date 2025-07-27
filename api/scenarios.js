export default async function handler(req, res) {
  console.log('🚀 Scenarios API called');
  console.log('Method:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Check environment variables first
    console.log('🔍 Checking environment variables...');
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:', { 
      hasSupabaseUrl, 
      hasSupabaseKey,
      supabaseUrlLength: process.env.SUPABASE_URL?.length,
      supabaseKeyLength: process.env.SUPABASE_ANON_KEY?.length
    });

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({
        success: false,
        error: 'Missing environment variables',
        debug: { hasSupabaseUrl, hasSupabaseKey }
      });
    }

    // Try importing Supabase
    console.log('📦 Importing Supabase...');
    let createClient;
    try {
      const supabaseModule = await import('@supabase/supabase-js');
      createClient = supabaseModule.createClient;
      console.log('✅ Supabase imported successfully');
    } catch (importError) {
      console.error('❌ Supabase import failed:', importError);
      return res.status(500).json({
        success: false,
        error: 'Failed to import Supabase',
        details: importError.message
      });
    }

    // Create client
    console.log('🔧 Creating Supabase client...');
    let supabase;
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('✅ Supabase client created');
    } catch (clientError) {
      console.error('❌ Supabase client creation failed:', clientError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create Supabase client',
        details: clientError.message
      });
    }

    // Test connection with simple query
    console.log('🔍 Testing database connection...');
    let data, error, count;
    try {
      const result = await supabase
        .from('scenarios')
        .select('id, title', { count: 'exact' })
        .limit(1);
      
      data = result.data;
      error = result.error;
      count = result.count;
      
      console.log('Database response:', { 
        hasData: !!data, 
        dataLength: data?.length, 
        hasError: !!error,
        count,
        errorDetails: error?.message
      });
    } catch (queryError) {
      console.error('❌ Database query failed:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: queryError.message
      });
    }

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    // If we get here, basic connection works
    // Now try to get all scenarios
    console.log('📚 Fetching all scenarios...');
    try {
      const { data: allScenarios, error: allError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      if (allError) {
        console.error('❌ Full query error:', allError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch scenarios',
          details: allError.message
        });
      }

      console.log(`✅ Success! Found ${allScenarios?.length || 0} scenarios`);
      
      return res.status(200).json({
        success: true,
        data: allScenarios || [],
        meta: {
          total: allScenarios?.length || 0,
          timestamp: new Date().toISOString()
        }
      });

    } catch (fetchError) {
      console.error('❌ Fetch scenarios error:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch scenarios',
        details: fetchError.message
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
    });
  }
}
