// Create temporary file: app/api/debug/oauth/route.ts
export async function GET() {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;
  
  return Response.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    redirectUri: redirectUri,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing'
  });
}
