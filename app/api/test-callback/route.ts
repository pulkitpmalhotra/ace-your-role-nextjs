// app/api/test-callback/route.ts - SIMPLE ENVIRONMENT TEST

export async function GET(request: Request) {
  console.log('🧪 === ENVIRONMENT TEST START ===');
  
  try {
    // Test 1: Basic environment variables
    console.log('📋 STEP 1: Check environment variables');
    const envVars = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      SUPABASE_URL: process.env.SUPABASE_URL || 'MISSING',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    };
    
    console.log('📊 Environment variables:', envVars);
    
    // Test 2: Import dependencies
    console.log('📋 STEP 2: Test imports');
    const { createClient } = await import('@supabase/supabase-js');
    const { SignJWT } = await import('jose');
    console.log('✅ STEP 2: All imports successful');
    
    // Test 3: Supabase connection
    console.log('📋 STEP 3: Test Supabase connection');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      console.log('✅ STEP 3: Supabase client created');
    } else {
      console.log('❌ STEP 3: Supabase env vars missing');
    }
    
    // Test 4: JWT signing
    console.log('📋 STEP 4: Test JWT signing');
    if (process.env.NEXTAUTH_SECRET) {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
      const testToken = await new SignJWT({ test: 'data' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      console.log('✅ STEP 4: JWT signing successful');
    } else {
      console.log('❌ STEP 4: NEXTAUTH_SECRET missing');
    }
    
    console.log('🧪 === ENVIRONMENT TEST END - SUCCESS ===');
    
    return Response.json({
      success: true,
      message: 'All environment tests passed',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 === ENVIRONMENT TEST EXCEPTION ===');
    console.error('💥 Error:', error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
