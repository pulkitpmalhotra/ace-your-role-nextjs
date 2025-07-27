// api/scenarios-minimal.js
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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check environment variables first
    console.log('🔍 Checking environment variables...');
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment check:', { hasSupabaseUrl, hasSupabaseKey });

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
    const { createClient } = await import('@supabase/supabase-js');
    console.log('✅ Supabase imported');

    // Create client
    console.log('🔧 Creating Supabase client...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase client created');

    // Test connection with simple query
    console.log('🔍 Testing database connection...');
    const { data, error, count } = await supabase
      .from('scenarios')
      .select('id, title', { count: 'exact' })
      .limit(1);

    console.log('Database response:', { 
      hasData: !!data, 
      dataLength: data?.length, 
      hasError: !!error,
      count
    });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      });
    }

    // Return success with minimal data
    console.log('✅ Success! Returning data...');
    return res.status(200).json({
      success: true,
      data: data || [],
      meta: {
        total: count,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    });
  }
}
