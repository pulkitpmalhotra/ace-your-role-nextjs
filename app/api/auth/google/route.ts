// app/api/auth/google/route.ts - Google OAuth Integration
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// Ensure consistent redirect URI
const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
};

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Handle OAuth login initiation and debugging
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'debug') {
      // Return configuration info for debugging
      return Response.json({
        success: true,
        debug: {
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set (' + process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : 'Missing',
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
          redirectUri: getRedirectUri(),
          nodeEnv: process.env.NODE_ENV
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

      // Generate OAuth URL
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ],
        include_granted_scopes: true,
        redirect_uri: getRedirectUri() // Explicitly set redirect URI
      });

      console.log('✅ Generated OAuth URL:', authUrl);

      return Response.json({
        success: true,
        authUrl
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

// Handle OAuth callback
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json(
        { success: false, error: 'Authorization code required' },
        { status: 400 }
      );
    }

    console.log('🔐 Processing Google OAuth callback...');

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await userInfoResponse.json();
    
    console.log('✅ Google user data:', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name
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

    console.log('✅ OAuth login successful for:', user.email);

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
    console.error('💥 OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
    
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
