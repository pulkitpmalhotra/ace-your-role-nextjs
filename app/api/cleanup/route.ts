// app/api/cleanup/route.ts - Automated cleanup for GDPR compliance
export async function POST() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Delete sessions older than 90 days (GDPR compliance)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: oldSessions, error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (deleteError) {
      console.error('❌ Cleanup error:', deleteError);
      throw deleteError;
    }

    console.log('✅ Cleanup completed:', oldSessions?.length || 0, 'sessions deleted');
    
    return Response.json({
      success: true,
      deleted: oldSessions?.length || 0,
      cutoff_date: ninetyDaysAgo.toISOString()
    });

  } catch (error) {
    console.error('💥 Cleanup API error:', error);
    return Response.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

// For Vercel cron job
export async function GET() {
  return POST();
}
