// /api/auth/google.js
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      // Update existing user
      await supabase
        .from('users')
        .update({
          google_id: googleId,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);
    } else {
      // Create new user
      await supabase
        .from('users')
        .insert({
          email,
          name,
          picture,
          google_id: googleId,
          created_at: new Date().toISOString()
        });
    }
    
    res.status(200).json({
      success: true,
      email,
      name,
      picture
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
}
