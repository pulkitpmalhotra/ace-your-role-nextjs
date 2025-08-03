// app/api/auth/google/callback/route.ts - DETAILED DEBUG VERSION

const getBaseUrl = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export async function GET(request: Request) {
  console.log('🔍 === DETAILED CALLBACK DEBUG START ===');
  
  try {
    console.log('📥 STEP 1: Parse callback URL');
    const { searchParams } = new URL(request.url);
    console.log('✅ STEP 1: URL parsed successfully');
    
    // Log all parameters
    console.log('📥 STEP 2: Extract parameters');
    const params = Array.from(searchParams.entries());
    console.log('📊 All parameters received:');
    params.forEach(([key, value]) => {
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
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&google_error=${error}&message=${encodeURIComponent(errorDescription || error)}&debug=google_error`
      );
    }

    if (!code) {
      console.log('❌ STEP 3: No authorization code - redirecting with error');
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=no_code&debug=missing_code`
      );
    }

    console.log('✅ STEP 3: Authorization code received');

    // Check environment variables before proceeding
    console.log('📥 STEP 4: Check environment variables');
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET', 
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ STEP 4: Missing environment variables:', missingVars);
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=missing_env_vars&debug=env_check&missing=${missingVars.join(',')}`
      );
    }
    console.log('✅ STEP 4: All environment variables present');

    console.log('📥 STEP 5: Attempt token exchange with Google');
    
    // MANUAL token exchange to avoid library issues
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
      console.error('❌ STEP 5: Token exchange failed');
      console.error('❌ Status:', tokenResponse.status);
      console.error('❌ Response:', errorText);
      
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=token_exchange_failed&debug=step5&status=${tokenResponse.status}`
      );
    }

    const tokens = await tokenResponse.json();
    console.log('✅ STEP 5: Token exchange successful');
    console.log('📊 Tokens received:', {
      access_token: tokens.access_token ? 'PRESENT' : 'MISSING',
      id_token: tokens.id_token ? 'PRESENT' : 'MISSING'
    });

    console.log('📥 STEP 6: Fetch user info from Google');
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('❌ STEP 6: User info fetch failed');
      console.error('❌ Status:', userInfoResponse.status);
      console.error('❌ Response:', errorText);
      
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=userinfo_failed&debug=step6&status=${userInfoResponse.status}`
      );
    }

    const googleUser = await userInfoResponse.json();
    console.log('✅ STEP 6: User info fetched successfully');
    console.log('📊 User data:', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      verified_email: googleUser.verified_email
    });

    console.log('📥 STEP 7: Initialize Supabase');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    console.log('✅ STEP 7: Supabase client created');

    console.log('📥 STEP 8: Check/create user in database');
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ STEP 8: Database fetch error:', fetchError);
      return Response.redirect(
        `${getBaseUrl()}/?error=oauth_error&message=db_fetch_error&debug=step8&code=${fetchError.code}`
      );
    }

    let user;
    if (existingUser) {
      console.log('📊 STEP 8: User exists, updating...');
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
        console.error('❌ STEP 8: User update failed:', updateError);
        return Response.redirect(
          `${getBaseUrl()}/?error=oauth_error&message=db_update_error&debug=step8&code=${updateError.code}`
        );
      }
      
      user = updatedUser;
      console.log('✅ STEP 8: User updated successfully');
    } else {
      console.log('📊 STEP 8: Creating new user...');
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
        console.error('❌ STEP 8: User creation failed:', createError);
        return Response.redirect(
          `${getBaseUrl()}/?error=oauth_error&message=db_create_error&debug=step8&code=${createError.code}`
        );
      }
      
      user = newUser;
      console.log('✅ STEP 8: New user created successfully');
    }

    console.log('📥 STEP 9: Generate JWT session token');
    const { SignJWT } = await import('jose');
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

    console.log('✅ STEP 9: JWT token generated successfully');

    console.log('📥 STEP 10: Create success redirect');
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
    console.log('✅ STEP 10: Success redirect URL created');
    console.log('🔍 === DETAILED CALLBACK DEBUG END - SUCCESS ===');

    return Response.redirect(redirectUrl);

  } catch (error) {
    console.error('💥 === CALLBACK EXCEPTION ===');
    console.error('💥 Error:', error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 === END EXCEPTION DEBUG ===');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.redirect(
      `${getBaseUrl()}/?error=oauth_error&message=${encodeURIComponent('Exception: ' + errorMessage)}&debug=exception_detailed`
    );
  }
}
