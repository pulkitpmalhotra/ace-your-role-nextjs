// app/api/privacy/delete/route.ts
export async function DELETE(request: Request) {
  try {
    const userEmail = await getUserEmailFromSession(request);
    if (!userEmail) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the deletion request
    await logAuditEvent(user.id, userEmail, 'ACCOUNT_DELETION', 'user_account', request);

    // Delete all user data in correct order (respecting foreign keys)
    await Promise.all([
      supabase.from('sessions').delete().eq('user_email', userEmail),
      supabase.from('user_progress').delete().eq('user_email', userEmail)
    ]);

    // Finally delete the user
    await supabase.from('users').delete().eq('email', userEmail);

    console.log('✅ Account completely deleted for:', userEmail);

    return Response.json({ 
      success: true, 
      message: 'Account and all associated data have been permanently deleted' 
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return Response.json({ error: 'Deletion failed' }, { status: 500 });
  }
}
