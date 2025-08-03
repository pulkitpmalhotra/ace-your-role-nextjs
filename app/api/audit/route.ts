// app/api/audit/route.ts
interface AuditLog {
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata?: any;
}

export async function logAuditEvent(
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  request: Request,
  metadata?: any
) {
  const auditLog: AuditLog = {
    user_id: userId,
    user_email: userEmail,
    action,
    resource,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    metadata
  };

  // Store in secure audit table
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await supabase.from('audit_logs').insert(auditLog);
}
