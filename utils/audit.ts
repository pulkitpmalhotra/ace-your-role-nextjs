// utils/audit.ts
import { createClient } from '@supabase/supabase-js';

interface AuditLog {
  user_id?: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata?: any;
}

export async function logAuditEvent(
  userEmail: string,
  action: string,
  resource: string,
  request: Request,
  metadata?: any,
  userId?: string
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase not configured for audit logging');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const auditLog: AuditLog = {
      user_id: userId,
      user_email: userEmail,
      action,
      resource,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      metadata
    };

    // Store in audit table (create table first)
    const { error } = await supabase.from('audit_logs').insert(auditLog);
    
    if (error) {
      console.error('❌ Failed to log audit event:', error);
    } else {
      console.log('✅ Audit event logged:', action, resource, userEmail);
    }
  } catch (error) {
    console.error('❌ Audit logging error:', error);
  }
}

// Security event types
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SESSION_CREATE: 'SESSION_CREATE',
  SESSION_END: 'SESSION_END',
  DATA_EXPORT: 'DATA_EXPORT',
  ACCOUNT_DELETE: 'ACCOUNT_DELETE',
  FAILED_LOGIN: 'FAILED_LOGIN',
  RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
} as const;

// Resource types
export const AUDIT_RESOURCES = {
  USER_ACCOUNT: 'user_account',
  USER_DATA: 'user_data',
  PRACTICE_SESSION: 'practice_session',
  AI_CONVERSATION: 'ai_conversation',
  SYSTEM_ACCESS: 'system_access'
} as const;

// Helper function to get user email from session token
export async function getUserEmailFromSession(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Basic JWT parsing (you might want to use a proper JWT library)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return payload.email || null;
  } catch (error) {
    console.error('❌ Failed to extract email from session:', error);
    return null;
  }
}

// Helper function to detect suspicious activity
export function detectSuspiciousActivity(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin') || '';
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /hack/i,
    /exploit/i,
    /injection/i
  ];
  
  // Known good bots that we should allow
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isAllowedBot = allowedBots.some(pattern => pattern.test(userAgent));
  
  return isSuspicious && !isAllowedBot;
}

// Log failed login attempts
export async function logFailedLogin(email: string, request: Request, reason: string) {
  await logAuditEvent(
    email,
    AUDIT_ACTIONS.FAILED_LOGIN,
    AUDIT_RESOURCES.USER_ACCOUNT,
    request,
    { reason, suspicious: detectSuspiciousActivity(request) }
  );
}

// Log successful login
export async function logSuccessfulLogin(email: string, request: Request, userId?: string) {
  await logAuditEvent(
    email,
    AUDIT_ACTIONS.LOGIN,
    AUDIT_RESOURCES.USER_ACCOUNT,
    request,
    { login_method: 'google_oauth' },
    userId
  );
}

// Log session creation
export async function logSessionCreate(email: string, request: Request, sessionId: string, scenarioId: string) {
  await logAuditEvent(
    email,
    AUDIT_ACTIONS.SESSION_CREATE,
    AUDIT_RESOURCES.PRACTICE_SESSION,
    request,
    { session_id: sessionId, scenario_id: scenarioId }
  );
}

// Log data export
export async function logDataExport(email: string, request: Request, dataType: string) {
  await logAuditEvent(
    email,
    AUDIT_ACTIONS.DATA_EXPORT,
    AUDIT_RESOURCES.USER_DATA,
    request,
    { data_type: dataType, export_format: 'json' }
  );
}

// Log account deletion
export async function logAccountDeletion(email: String, request: Request, userId: string) {
  await logAuditEvent(
    email,
    AUDIT_ACTIONS.ACCOUNT_DELETE,
    AUDIT_RESOURCES.USER_ACCOUNT,
    request,
    { user_id: userId, deletion_type: 'user_requested' }
  );
}
