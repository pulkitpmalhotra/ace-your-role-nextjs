// app/api/privacy/export/route.ts
export async function POST(request: Request) {
  try {
    const userEmail = await getUserEmailFromSession(request);
    if (!userEmail) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Gather all user data
    const [userData, sessionsData, progressData] = await Promise.all([
      supabase.from('users').select('*').eq('email', userEmail).single(),
      supabase.from('sessions').select('*').eq('user_email', userEmail),
      supabase.from('user_progress').select('*').eq('user_email', userEmail)
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_profile: userData.data,
      practice_sessions: sessionsData.data?.map(session => ({
        ...session,
        // Remove sensitive internal fields
        id: undefined,
        user_id: undefined
      })),
      progress_data: progressData.data,
      data_retention_policy: "Data is automatically deleted after 90 days",
      export_format: "JSON",
      privacy_policy_version: "1.0"
    };

    // Log the export request
    await logAuditEvent(userData.data?.id, userEmail, 'DATA_EXPORT', 'user_data', request);

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="my-data-export.json"'
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    return Response.json({ error: 'Export failed' }, { status: 500 });
  }
}
