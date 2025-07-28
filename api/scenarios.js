// api/scenarios.js - Enhanced with filtering and search
export default async function handler(req, res) {
  console.log('🚀 Scenarios API called');
  console.log('Method:', req.method);
  console.log('Query params:', req.query);
  
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

    // Import Supabase
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

    // Parse query parameters for filtering
    const {
      category = 'all',
      difficulty = 'all',
      search = '',
      subcategory = 'all',
      tags = '',
      limit = '50'
    } = req.query;

    console.log('🔍 Applying filters:', {
      category,
      difficulty, 
      search,
      subcategory,
      tags,
      limit
    });

    // Build query
    let query = supabase
      .from('scenarios')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    if (subcategory !== 'all') {
      query = query.eq('subcategory', subcategory);
    }

    // Search in title and description
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,character_name.ilike.%${search}%`);
    }

    // Filter by tags if provided
    if (tags.trim()) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.overlaps('tags', tagArray);
    }

    // Apply ordering and limit
    query = query
      .order('difficulty', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    console.log('💾 Executing database query...');
    const { data: scenarios, error } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch scenarios',
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log(`✅ Success! Found ${scenarios?.length || 0} scenarios`);
    
    // Get metadata for filtering UI
    const metadata = await getMetadata(supabase, category);
    
    return res.status(200).json({
      success: true,
      data: scenarios || [],
      meta: {
        total: scenarios?.length || 0,
        filters: {
          category,
          difficulty,
          search,
          subcategory,
          tags
        },
        ...metadata,
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
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}

// Helper function to get metadata
async function getMetadata(supabase, category) {
  try {
    // Get available categories
    const { data: categoryData } = await supabase
      .from('scenarios')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);
    
    const availableCategories = [...new Set(categoryData?.map(item => item.category) || [])];

    // Get available subcategories based on category
    let subcategoryQuery = supabase
      .from('scenarios')
      .select('subcategory')
      .eq('is_active', true)
      .not('subcategory', 'is', null);
    
    if (category !== 'all') {
      subcategoryQuery = subcategoryQuery.eq('category', category);
    }
    
    const { data: subcategoryData } = await subcategoryQuery;
    const availableSubcategories = [...new Set(subcategoryData?.map(item => item.subcategory) || [])];

    return {
      availableCategories: availableCategories.sort(),
      availableSubcategories: availableSubcategories.sort(),
      availableDifficulties: ['beginner', 'intermediate', 'advanced']
    };
  } catch (error) {
    console.error('Failed to get metadata:', error);
    return {
      availableCategories: ['sales', 'leadership', 'healthcare', 'support'],
      availableSubcategories: [],
      availableDifficulties: ['beginner', 'intermediate', 'advanced']
    };
  }
}
