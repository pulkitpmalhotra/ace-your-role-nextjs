// app/api/scenarios/route.ts - Real Supabase Integration
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const difficulty = searchParams.get('difficulty') || 'all';
    const search = searchParams.get('search') || '';
    
    console.log('📚 Fetching scenarios from Supabase with filters:', { category, difficulty, search });

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,character_name.ilike.%${search}%`);
    }
    
    // Execute query
    const { data: scenarios, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error('❌ Supabase query error:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }

    console.log(`✅ Retrieved ${scenarios?.length || 0} scenarios from Supabase`);

    // Get category and difficulty stats for metadata
    const { data: categoryStats } = await supabase
      .from('scenarios')
      .select('category')
      .eq('is_active', true);

    const { data: difficultyStats } = await supabase
      .from('scenarios')
      .select('difficulty')
      .eq('is_active', true);

    const categories = [...new Set(categoryStats?.map(s => s.category) || [])];
    const difficulties = [...new Set(difficultyStats?.map(s => s.difficulty) || [])];

    return Response.json({
      success: true,
      data: scenarios || [],
      meta: {
        total: scenarios?.length || 0,
        filters: { category, difficulty, search },
        available_categories: categories,
        available_difficulties: difficulties,
        timestamp: new Date().toISOString(),
        source: 'supabase'
      }
    });

  } catch (error) {
    console.error('💥 Scenarios API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
