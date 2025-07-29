// REPLACE the existing query building with:
async function handler(req, res) {
  // ... existing setup code ...

  try {
    const {
      category = 'all',
      difficulty = 'all',
      search = '',
      subcategory = 'all',
      tags = '',
      limit = '50'
    } = req.query;

    let data;
    
    if (search.trim()) {
      // Use optimized full-text search
      const { data: searchResults, error } = await supabase
        .rpc('search_scenarios', {
          search_term: search.trim(),
          category_filter: category,
          difficulty_filter: difficulty,
          limit_param: parseInt(limit)
        });
      
      if (error) throw error;
      data = searchResults;
    } else {
      // Use optimized regular query
      let query = supabase
        .from('scenarios')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (category !== 'all') query = query.eq('category', category);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);
      if (subcategory !== 'all') query = query.eq('subcategory', subcategory);
      
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query = query.overlaps('tags', tagArray);
      }

      query = query
        .order('difficulty', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      const { data: queryResults, error } = await query;
      if (error) throw error;
      data = queryResults;
    }

    // Get metadata
    const metadata = await getMetadata(supabase, category);
    
    return res.status(200).json({
      success: true,
      data: data || [],
      meta: {
        total: data?.length || 0,
        filters: { category, difficulty, search, subcategory, tags },
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Scenarios API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
