// app/api/auth/google/callback/route.ts - NEXT.JS 13+ APP ROUTER COMPATIBLE

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const getBaseUrl = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export async function GET(request: NextRequest) {
  console.log('🔍 === OAUTH CALLBACK DEBUG START ===');
  
  try {
    console.log('📥 STEP 1: Parse callback URL');
    // Fix: Use NextRequest.nextUrl instead of new URL(request.url)
    const searchParams = request.nextUrl.searchParams;
    console.log('✅ STEP 1: URL parsed successfully');
    
    // Log all parameters safely
    console.log('📥 STEP 2: Extract parameters');
    const paramEntries: [string, string][] = [];
    searchParams.forEach((value, key) => {
      paramEntries.push([key, value]);
    });
    
    console.log('📊 All parameters received:');
    paramEntries.forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });
    
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('📊 Key parameters:');
    console.log('    code:', code ? `PRESENT (${code.length} chars)` : 'MISSING');
    console.log('    error:', error || 'NONE');
    console.log('    error_description:', errorDescription || 'NONE');
    console.log('✅ STEP 2: Parameters extracted');

    if (error) {
      console.log('❌ STEP 3: OAuth error from Google - redirecting with error');
      const errorUrl = `${getBaseUrl()}/?error=oauth_error&google_error=${error}&message=${encodeURIComponent(errorDescription || error)}&debug=google_error`;
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      console.log('❌ STEP 3: No authorization code - redirecting with error');
      const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=no_code&debug=missing_code`;
      return NextResponse.redirect(errorUrl);
    }

    console.log('✅ STEP 3: Authorization code received');

    console.log('📥 STEP 4: Attempt token exchange with Google');
    
    // MANUAL token exchange
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
      
      const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=token_exchange_failed&debug=step4&status=${tokenResponse.status}`;
      return NextResponse.redirect(errorUrl);
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
      
      const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=userinfo_failed&debug=step5&status=${userInfoResponse.status}`;
      return NextResponse.redirect(errorUrl);
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
      const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=db_fetch_error&debug=step6&code=${fetchError.code}`;
      return NextResponse.redirect(errorUrl);
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
        const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=db_update_error&debug=step6&code=${updateError.code}`;
        return NextResponse.redirect(errorUrl);
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
        const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=db_create_error&debug=step6&code=${createError.code}`;
        return NextResponse.redirect(errorUrl);
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
    const successParams = new URLSearchParams({
      success: 'true',
      sessionToken: sessionToken,
      user: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        emailVerified: user.email_verified
      }),
      isNewUser: (!existingUser).toString()
    });

    const redirectUrl = `${getBaseUrl()}/auth/callback?${successParams.toString()}`;
    console.log('✅ STEP 8: Success redirect URL created');
    console.log('🔍 === OAUTH CALLBACK DEBUG END - SUCCESS ===');

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('💥 === CALLBACK EXCEPTION ===');
    console.error('💥 Error:', error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 === END EXCEPTION DEBUG ===');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorUrl = `${getBaseUrl()}/?error=oauth_error&message=${encodeURIComponent('Exception: ' + errorMessage)}&debug=exception_detailed`;
    
    return NextResponse.redirect(errorUrl);
  }
}
