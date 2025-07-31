// app/api/progress/route.ts - User Progress Tracking
import { createClient } from '@supabase/supabase-js';

// Get user progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');
    const category = searchParams.get('category');
    
    if (!user_email) {
      return Response.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching progress for:', user_email, category || 'all categories');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build query
    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_email', user_email);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data: progress, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching progress:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Get user overall stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_sessions, total_minutes, created_at')
      .eq('email', user_email)
      .single();

    if (userError) {
      console.error('❌ Error fetching user stats:', userError);
    }

    // Get recent sessions for activity
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id, start_time, duration_minutes, overall_score, session_status,
        scenarios:scenarios(title, character_name, category, difficulty)
      `)
      .eq('user_email', user_email)
      .eq('session_status', 'completed')
      .order('start_time', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('❌ Error fetching recent sessions:', sessionsError);
    }

    // Calculate summary stats
    const summary = {
      total_categories: progress?.length || 0,
      total_sessions: user?.total_sessions || 0,
      total_minutes: user?.total_minutes || 0,
      overall_average_score: progress?.length ? 
        progress.reduce((sum, p) => sum + (p.average_score || 0), 0) / progress.length : 0,
      best_category: progress?.length ? 
        progress.reduce((best, current) => 
          (current.best_score || 0) > (best.best_score || 0) ? current : best
        ) : null,
      days_active: user?.created_at ? 
        Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      streak_days: calculateStreak(recentSessions || [])
    };

    console.log(`✅ Retrieved progress for ${user_email}: ${progress?.length || 0} categories`);

    return Response.json({
      success: true,
      data: {
        progress: progress || [],
        summary,
        recent_sessions: recentSessions || []
      }
    });

  } catch (error) {
    console.error('💥 Progress GET API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Calculate practice streak
function calculateStreak(sessions: any[]): number {
  if (!sessions.length) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // Get unique practice dates
  const practiceDates = [...new Set(
    sessions.map(s => {
      const date = new Date(s.start_time);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  )].sort((a, b) => b - a); // Sort descending
  
  // Check for consecutive days
  for (const practiceDate of practiceDates) {
    if (practiceDate === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (practiceDate < currentDate.getTime()) {
      break; // Gap in streak
    }
  }
  
  return streak;
}

// Update or create progress (manual endpoint for admin use)
export async function POST(request: Request) {
  try {
    const { user_email, category, session_data } = await request.json();
    
    if (!user_email || !category) {
      return Response.json(
        { success: false, error: 'User email and category are required' },
        { status: 400 }
      );
    }

    console.log('📈 Manually updating progress for:', user_email, category);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_email', user_email)
      .eq('category', category)
      .single();

    let result;
    
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          ...session_data,
          last_session_date: new Date().toISOString()
        })
        .eq('user_email', user_email)
        .eq('category', category)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error updating progress:', error);
        return Response.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          user_email,
          category,
          ...session_data,
          last_session_date: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error creating progress:', error);
        return Response.json(
          { success: false, error: 'Failed to create progress' },
          { status: 500 }
        );
      }
      
      result = data;
    }

    console.log('✅ Progress updated for:', user_email, category);

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('💥 Progress POST API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
