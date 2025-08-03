// app/api/auth/google/callback/route.ts - CLEAN PRODUCTION VERSION

const getBaseUrl = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', errorDescription || error);
      
      return Response.redirect(errorUrl.toString());
    }

    if (!code) {
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', 'Authorization failed');
      
      return Response.redirect(errorUrl.toString());
    }

    // Exchange code for user data by calling our POST endpoint
    const response = await fetch(`${getBaseUrl()}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const result = await response.json();

    if (!result.success) {
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', result.error || 'Authentication failed');
      
      return Response.redirect(errorUrl.toString());
    }

    // Create success URL with user data
    const successUrl = new URL('/auth/callback', getBaseUrl());
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('sessionToken', result.sessionToken);
    successUrl.searchParams.set('user', JSON.stringify(result.user));
    successUrl.searchParams.set('isNewUser', result.isNewUser.toString());

    return Response.redirect(successUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    const errorUrl = new URL('/', getBaseUrl());
    errorUrl.searchParams.set('error', 'oauth_error');
    errorUrl.searchParams.set('message', 'Authentication failed');
    
    return Response.redirect(errorUrl.toString());
  }
}
