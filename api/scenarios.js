// Update api/scenarios.js
import { withAuth } from '../lib/auth.js';

async function handler(req, res) {
  console.log('🚀 Scenarios API called');
  console.log('Method:', req.method);
  console.log('Query params:', req.query);
  
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
    
    // Add metadata for filtering UI
    const metadata = {
      total: scenarios?.length || 0,
      filters: {
        category,
        difficulty,
        search,
        subcategory,
        tags
      },
      availableCategories: await getAvailableCategories(supabase),
      availableSubcategories: await getAvailableSubcategories(supabase, category),
      availableDifficulties: ['beginner', 'intermediate', 'advanced']
    };
    
    return res.status(200).json({
      success: true,
      data: scenarios || [],
      meta: {
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

// Helper function to get available categories
async function getAvailableCategories(supabase) {
  try {
    const { data } = await supabase
      .from('scenarios')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);
    
    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories.sort();
  } catch (error) {
    console.error('Failed to get categories:', error);
    return ['sales', 'leadership', 'healthcare', 'support'];
  }
}

// Helper function to get available subcategories
async function getAvailableSubcategories(supabase, category) {
  try {
    let query = supabase
      .from('scenarios')
      .select('subcategory')
      .eq('is_active', true)
      .not('subcategory', 'is', null);
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data } = await query;
    const subcategories = [...new Set(data?.map(item => item.subcategory) || [])];
    return subcategories.sort();
  } catch (error) {
    console.error('Failed to get subcategories:', error);
    return [];
  }
}

// Export with public access (no auth required for browsing scenarios)
export default withAuth(handler, { public: true });
