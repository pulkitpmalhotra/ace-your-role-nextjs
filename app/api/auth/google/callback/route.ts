// app/api/auth/google/callback/route.ts - OAuth Callback Handler

// Use same redirect URI logic
const getBaseUrl = () => {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ OAuth error:', error);
      // Redirect to login with error
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=no_code`
      );
    }

    // Exchange code for user data by calling our POST endpoint
    const response = await fetch(`${getBaseUrl()}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ OAuth exchange failed:', result.error);
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=${encodeURIComponent(result.error)}`
      );
    }

    // Create success URL with user data
    const successParams = new URLSearchParams({
      success: 'true',
      sessionToken: result.sessionToken,
      user: JSON.stringify(result.user),
      isNewUser: result.isNewUser.toString()
    });

    console.log('✅ OAuth callback successful, redirecting to dashboard');

    return Response.redirect(
      `${getBaseUrl()}/auth/callback?${successParams.toString()}`
    );

  } catch (error) {
    console.error('💥 OAuth callback error:', error);
    return Response.redirect(
      `${getBaseUrl()}/?error=oauth_error&message=callback_failed`
    );
  }
}
