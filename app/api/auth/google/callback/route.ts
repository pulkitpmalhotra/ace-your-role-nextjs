// app/api/auth/google/callback/route.ts - TYPESCRIPT COMPATIBLE VERSION

import { NextRequest } from 'next/server';

// Use same redirect URI logic
const getBaseUrl = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  // Remove trailing slash if present
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🔍 DEBUG: Log ALL parameters received from Google
    console.log('🔍 === OAUTH CALLBACK DEBUG ===');
    console.log('📥 Full callback URL:', request.url);
    console.log('📥 All URL parameters received from Google:');
    
    // Fixed: Convert iterator to array for TypeScript compatibility
    const params = Array.from(searchParams.entries());
    params.forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');
    
    console.log('📊 Parsed OAuth Response:');
    console.log('    code:', code ? `${code.substring(0, 20)}...` : 'NULL');
    console.log('    error:', error || 'NULL');
    console.log('    error_description:', errorDescription || 'NULL');
    console.log('    state:', state || 'NULL');
    console.log('🔍 === END DEBUG ===');

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      console.error('❌ Error description:', errorDescription);
      
      // Create detailed error URL for debugging
      const errorParams = new URLSearchParams({
        error: 'oauth_error',
        google_error: error,
        message: errorDescription || error,
        debug: 'callback_error'
      });
      
      return Response.redirect(
        `${getBaseUrl()}/?${errorParams.toString()}`
      );
    }

    if (!code) {
      console.error('❌ No authorization code received from Google');
      console.error('❌ This usually means Google rejected the OAuth request');
      
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=no_code&debug=missing_code`
      );
    }

    console.log('✅ Authorization code received, proceeding with token exchange...');

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
        `${getBaseUrl()}/?error=oauth_error&message=${encodeURIComponent(result.error)}&debug=exchange_failed`
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
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return Response.redirect(
      `${getBaseUrl()}/?error=oauth_error&message=callback_failed&debug=exception`
    );
  }
}
