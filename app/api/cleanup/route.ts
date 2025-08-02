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
    
    // First count how many sessions will be deleted
    const { count: sessionsToDelete, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (countError) {
      console.error('❌ Error counting sessions to delete:', countError);
      throw countError;
    }

    // Delete the sessions and get the deleted rows back
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (deleteError) {
      console.error('❌ Cleanup error:', deleteError);
      throw deleteError;
    }

    const deletedCount = deletedSessions?.length || 0;
    console.log('✅ Cleanup completed:', deletedCount, 'sessions deleted');
    
    return Response.json({
      success: true,
      deleted: deletedCount,
      cutoff_date: ninetyDaysAgo.toISOString(),
      sessions_found: sessionsToDelete || 0
    });

  } catch (error) {
    console.error('💥 Cleanup API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { success: false, error: 'Cleanup failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// For Vercel cron job
export async function GET() {
  return POST();
}
