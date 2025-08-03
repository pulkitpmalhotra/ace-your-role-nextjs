// app/api/users/route.ts - Google OAuth Only User Management
import { createClient } from '@supabase/supabase-js';

// Environment variable checker
function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
  };

  console.log('🔍 Environment variable status:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✓ Set' : '❌ Missing'}`);
  });

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const availableEnvVars = Object.keys(process.env)
      .filter(key => key.includes('SUPABASE') || key.includes('GOOGLE') || key.includes('NEXTAUTH'))
      .sort();
    
    console.error('❌ Missing required variables:', missing);
    console.log('📋 Available env vars:', availableEnvVars);
    
    return {
      isValid: false,
      missing,
      available: availableEnvVars,
      error: `Missing environment variables: ${missing.join(', ')}`
    };
  }

  return {
    isValid: true,
    missing: [],
    available: Object.keys(requiredVars),
    error: null
  };
}

// This endpoint is now only used for Google OAuth user creation/updates
export async function POST(request: Request) {
  return Response.json({
    success: false,
    error: 'Direct user creation disabled. Please use Google OAuth sign-in.',
    message: 'This endpoint no longer supports email-only registration. All users must authenticate through Google OAuth for security and convenience.'
  }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return Response.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    if (!envCheck.isValid) {
      return Response.json({
        success: false,
        error: 'System configuration missing',
        details: envCheck
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    // Get user with progress stats - only Google OAuth users
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        sessions:sessions(count),
        user_progress:user_progress(*)
      `)
      .eq('email', email)
      .eq('auth_provider', 'google') // Only Google OAuth users
      .single();

    if (error) {
      console.error('❌ Error fetching user details:', error);
      return Response.json(
        { success: false, error: 'User not found or not authenticated via Google' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('💥 User GET API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return Response.json({
      success: false,
      error: `Internal server error: ${errorMessage}`
    }, { status: 500 });
  }
}
