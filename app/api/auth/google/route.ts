// app/api/auth/google/route.ts - MANUAL URL CONSTRUCTION APPROACH

import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// FIXED: Completely manual URL construction
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://ace-your-role-nextjs.vercel.app/api/auth/google/callback';
  }
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  return `${cleanBaseUrl}/api/auth/google/callback`;
};

// Handle OAuth login initiation and debugging
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'debug') {
      const redirectUri = getRedirectUri();
      return Response.json({
        success: true,
        debug: {
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set (' + process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : 'Missing',
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
          redirectUri: redirectUri,
          nodeEnv: process.env.NODE_ENV,
          productionMode: process.env.NODE_ENV === 'production'
        }
      });
    }

    if (action === 'login') {
      // Validate required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('❌ Missing Google OAuth credentials');
        return Response.json({
          success: false,
          error: 'Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET'
        }, { status: 500 });
      }

      const redirectUri = getRedirectUri();
      const clientId = process.env.GOOGLE_CLIENT_ID;
      
      console.log('🔐 Creating OAuth URL with MANUAL construction:');
      console.log('  - Client ID:', clientId.substring(0, 20) + '...');
      console.log('  - Redirect URI:', redirectUri);
      console.log('  - Environment:', process.env.NODE_ENV);

      // 🚀 COMPLETELY MANUAL URL CONSTRUCTION
      const responseType = 'code'; // Ensure this is never null/undefined
      const scope = 'openid email profile';
      const accessType = 'offline';
      const prompt = 'consent';
      
      // Build URL piece by piece to ensure no parameters are lost
      const baseAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      
      // Method 1: Template literal (most explicit)
      const authUrl = `${baseAuthUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=${accessType}&prompt=${prompt}`;

      console.log('✅ Manually constructed OAuth URL:');
      console.log('URL:', authUrl);
      console.log('Contains response_type:', authUrl.includes('response_type=code'));
      console.log('URL Length:', authUrl.length);
      
      // Additional verification
      const urlParts = authUrl.split('&');
      console.log('🔍 URL Parts:');
      urlParts.forEach((part, index) => {
        console.log(`  ${index}: ${part}`);
      });

      return Response.json({
        success: true,
        authUrl: authUrl,
        debug: {
          method: 'manual_construction',
          redirectUri,
          clientId: clientId.substring(0, 20) + '...',
          responseType,
          scope,
          responseTypePresent: authUrl.includes('response_type=code'),
          urlLength: authUrl.length,
          environment: process.env.NODE_ENV,
          urlParts: urlParts.length
        }
      });
    }

    return Response.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return Response.json(
      { success: false, error: 'OAuth setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OAuth callback - MANUAL TOKEN EXCHANGE
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json(
        { success: false, error: 'Authorization code required' },
        { status: 400 }
      );
    }

    console.log('🔐 Processing Google OAuth callback with MANUAL token exchange...');

    // MANUAL token exchange instead of using google-auth-library
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const redirectUri = getRedirectUri();
    
    const tokenParams = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    console.log('🔄 Token exchange request:', {
      url: tokenUrl,
      redirect_uri: redirectUri,
      code_length: code.length
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Google token exchange error:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      console.error('❌ No access token in response:', tokens);
      throw new Error('No access token received from Google');
    }

    console.log('✅ Tokens received:', {
      access_token: tokens.access_token ? 'PRESENT' : 'MISSING',
      id_token: tokens.id_token ? 'PRESENT' : 'MISSING',
      refresh_token: tokens.refresh_token ? 'PRESENT' : 'MISSING'
    });

    // Get user info from Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('❌ Google userinfo API error:', errorText);
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await userInfoResponse.json();
    
    console.log('✅ Google user data:', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      verified_email: googleUser.verified_email
    });

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists or create new user
    let user;
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      throw new Error('Database error during user lookup');
    }

    if (existingUser) {
      // Update existing user with Google info
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
        console.error('❌ Error updating user:', updateError);
        throw new Error('Failed to update user');
      }

      user = updatedUser;
      console.log('✅ Updated existing user:', user.email);
    } else {
      // Create new user
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
        console.error('❌ Error creating user:', createError);
        
        if (createError.code === '23505') {
          throw new Error('User with this email already exists');
        }
        
        throw new Error('Failed to create user account');
      }

      user = newUser;
      console.log('✅ Created new user:', user.email);
    }

    // Generate JWT session token
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET not configured');
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
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

    console.log('✅ Manual OAuth login successful for:', user.email);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        emailVerified: user.email_verified
      },
      sessionToken,
      isNewUser: !existingUser
    });

  } catch (error) {
    console.error('💥 Manual OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
    
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
