// api/user-management.js - Fixed to work with proper database schema
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('👤 User Management API called');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { action, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    switch (action) {
      case 'create-or-verify':
        const result = await createOrVerifyUser(email);
        return res.status(200).json({
          success: true,
          data: result
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

  } catch (error) {
    console.error('❌ User management error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'User management failed'
    });
  }
}

async function createOrVerifyUser(email) {
  try {
    console.log('👤 Checking if user exists:', email);
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking user:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingUser) {
      console.log('✅ User already exists:', email);
      return {
        user: existingUser,
        created: false,
        message: 'User verified'
      };
    }

    // Create new user - removed updated_at as it's handled by trigger
    console.log('➕ Creating new user:', email);
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email,
        legacy_email_login: true,
        email_verified: true
        // created_at and updated_at are handled automatically by database
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('✅ User created successfully:', email);
    return {
      user: newUser,
      created: true,
      message: 'User created successfully'
    };

  } catch (error) {
    console.error('❌ createOrVerifyUser failed:', error);
    throw error;
  }
}
