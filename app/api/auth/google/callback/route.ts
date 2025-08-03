// app/api/auth/google/callback/route.ts - BULLETPROOF NEXT.JS COMPATIBILITY

import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const getBaseUrl = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  console.log('🔍 === OAUTH CALLBACK DEBUG START ===');
  
  try {
    console.log('📥 STEP 1: Parse callback URL');
    // Use the most compatible approach - parse the URL string directly
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    console.log('✅ STEP 1: URL parsed successfully');
    console.log('📊 Raw URL:', request.url);
    
    // Extract parameters manually to avoid Next.js issues
    console.log('📥 STEP 2: Extract parameters manually');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');
    
    // Log all parameters
    console.log('📊 All URL parameters:');
    console.log(`    Full URL: ${request.url}`);
    console.log(`    code: ${code ? `PRESENT (${code.length} chars)` : 'MISSING'}`);
    console.log(`    error: ${error || 'NONE'}`);
    console.log(`    error_description: ${errorDescription || 'NONE'}`);
    console.log(`    state: ${state || 'NONE'}`);
    console.log('✅ STEP 2: Parameters extracted');

    if (error) {
      console.log('❌ STEP 3: OAuth error from Google - redirecting with error');
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('google_error', error);
      errorUrl.searchParams.set('message', errorDescription || error);
      errorUrl.searchParams.set('debug', 'google_error');
      
      return Response.redirect(errorUrl.toString());
    }

    if (!code) {
      console.log('❌ STEP 3: No authorization code - redirecting with error');
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', 'no_code');
      errorUrl.searchParams.set('debug', 'missing_code');
      
      return Response.redirect(errorUrl.toString());
    }

    console.log('✅ STEP 3: Authorization code received');

    console.log('📥 STEP 4: Attempt token exchange with Google');
    
    // Token exchange
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
    
    console.log('🔄 Token exchange details:');
    console.log('    tokenUrl:', tokenUrl);
    console.log('    redirectUri:', redirectUri);
    console.log('    clientId:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    
    const tokenParams = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });

    console.log('📊 Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ STEP 4: Token exchange failed');
      console.error('❌ Status:', tokenResponse.status);
      console.error('❌ Response:', errorText);
      
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', 'token_exchange_failed');
      errorUrl.searchParams.set('debug', 'step4');
      errorUrl.searchParams.set('status', tokenResponse.status.toString());
      errorUrl.searchParams.set('details', errorText.substring(0, 200));
      
      return Response.redirect(errorUrl.toString());
    }

    const tokens = await tokenResponse.json();
    console.log('✅ STEP 4: Token exchange successful');
    console.log('📊 Tokens received:', {
      access_token: tokens.access_token ? 'PRESENT' : 'MISSING',
      id_token: tokens.id_token ? 'PRESENT' : 'MISSING'
    });

    console.log('📥 STEP 5: Fetch user info from Google');
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('❌ STEP 5: User info fetch failed');
      console.error('❌ Status:', userInfoResponse.status);
      console.error('❌ Response:', errorText);
      
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', 'userinfo_failed');
      errorUrl.searchParams.set('debug', 'step5');
      errorUrl.searchParams.set('status', userInfoResponse.status.toString());
      
      return Response.redirect(errorUrl.toString());
    }

    const googleUser = await userInfoResponse.json();
    console.log('✅ STEP 5: User info fetched successfully');
    console.log('📊 User data:', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      verified_email: googleUser.verified_email
    });

    console.log('📥 STEP 6: Initialize Supabase and handle user');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    console.log('✅ STEP 6: Supabase client created');

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ STEP 6: Database fetch error:', fetchError);
      const errorUrl = new URL('/', getBaseUrl());
      errorUrl.searchParams.set('error', 'oauth_error');
      errorUrl.searchParams.set('message', 'db_fetch_error');
      errorUrl.searchParams.set('debug', 'step6');
      errorUrl.searchParams.set('code', fetchError.code || 'unknown');
      
      return Response.redirect(errorUrl.toString());
    }

    let user;
    if (existingUser) {
      console.log('📊 STEP 6: User exists, updating...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: googleUser.name,
          google_id: googleUser.id,
          picture: googleUser.picture,
          email_verified: googleUser.verified_email,
          auth_provider: 'google',
          last_login: new Date().toISOString()
        })
        .eq('email', googleUser.email)
        .select()
        .single();

      if (updateError) {
        console.error('❌ STEP 6: User update failed:', updateError);
        const errorUrl = new URL('/', getBaseUrl());
        errorUrl.searchParams.set('error', 'oauth_error');
        errorUrl.searchParams.set('message', 'db_update_error');
        errorUrl.searchParams.set('debug', 'step6');
        errorUrl.searchParams.set('code', updateError.code || 'unknown');
        
        return Response.redirect(errorUrl.toString());
      }
      
      user = updatedUser;
      console.log('✅ STEP 6: User updated successfully');
    } else {
      console.log('📊 STEP 6: Creating new user...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          picture: googleUser.picture,
          email_verified: googleUser.verified_email,
          auth_provider: 'google',
          last_login: new Date().toISOString(),
          total_sessions: 0,
          total_minutes: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ STEP 6: User creation failed:', createError);
        const errorUrl = new URL('/', getBaseUrl());
        errorUrl.searchParams.set('error', 'oauth_error');
        errorUrl.searchParams.set('message', 'db_create_error');
        errorUrl.searchParams.set('debug', 'step6');
        errorUrl.searchParams.set('code', createError.code || 'unknown');
        
        return Response.redirect(errorUrl.toString());
      }
      
      user = newUser;
      console.log('✅ STEP 6: New user created successfully');
    }

    console.log('📥 STEP 7: Generate JWT session token');
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    
    const sessionToken = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    console.log('✅ STEP 7: JWT token generated successfully');

    console.log('📥 STEP 8: Create success redirect');
    const successUrl = new URL('/auth/callback', getBaseUrl());
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('sessionToken', sessionToken);
    successUrl.searchParams.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      emailVerified: user.email_verified
    }));
    successUrl.searchParams.set('isNewUser', (!existingUser).toString());

    console.log('✅ STEP 8: Success redirect URL created');
    console.log('🔍 === OAUTH CALLBACK DEBUG END - SUCCESS ===');

    return Response.redirect(successUrl.toString());

  } catch (error) {
    console.error('💥 === CALLBACK EXCEPTION ===');
    console.error('💥 Error:', error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 === END EXCEPTION DEBUG ===');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorUrl = new URL('/', getBaseUrl());
    errorUrl.searchParams.set('error', 'oauth_error');
    errorUrl.searchParams.set('message', `Exception: ${errorMessage}`);
    errorUrl.searchParams.set('debug', 'exception_detailed');
    
    return Response.redirect(errorUrl.toString());
  }
}
