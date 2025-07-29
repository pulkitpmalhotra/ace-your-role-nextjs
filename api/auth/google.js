import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;
    
    // Verify Google JWT token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Create or update user
    const user = await createOrUpdateGoogleUser({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleId: payload.sub,
      emailVerified: payload.email_verified
    });
    
    const token = generateJWTToken(user.id);
    res.json({ success: true, data: { user, token } });
    
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
}

async function createOrUpdateGoogleUser(googleData) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', googleData.email)
    .single();

  if (existingUser) {
    // Update existing user with Google data
    const { data: updatedUser } = await supabase
      .from('users')
      .update({
        google_id: googleData.googleId,
        profile_picture: googleData.picture,
        email_verified: googleData.emailVerified
      })
      .eq('id', existingUser.id)
      .select()
      .single();
    
    return updatedUser;
  } else {
    // Create new user
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        email: googleData.email,
        full_name: googleData.name,
        google_id: googleData.googleId,
        profile_picture: googleData.picture,
        email_verified: googleData.emailVerified,
        legacy_email_login: false
      })
      .select()
      .single();
    
    return newUser;
  }
}
