// app/api/test-env/route.ts - Test Environment Variables
export async function GET() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY'
  ];

  const envStatus = requiredVars.map(varName => ({
    name: varName,
    isSet: !!process.env[varName],
    value: process.env[varName] ? `${process.env[varName]?.substring(0, 10)}...` : 'Not set'
  }));

  const allSet = envStatus.every(env => env.isSet);

  return Response.json({
    success: allSet,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: envStatus,
    message: allSet 
      ? 'All environment variables are configured correctly!' 
      : 'Some environment variables are missing. Please check your Vercel environment variables.',
    nextSteps: allSet 
      ? ['Your environment is ready!', 'You can now use the application normally.']
      : [
          'Go to Vercel Dashboard → Settings → Environment Variables',
          'Add the missing environment variables',
          'Redeploy your application',
          'Test again by visiting /api/test-env'
        ]
  });
}
