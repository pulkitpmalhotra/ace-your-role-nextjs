import { AuthService, withAuth } from '../../lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // For backward compatibility, allow email-only login for legacy users
    if (password === 'legacy-login') {
      // Check if user exists and is legacy
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        // Create legacy user
        const { data: newUser } = await supabase
          .from('users')
          .insert({ 
            email, 
            legacy_email_login: true,
            email_verified: true 
          })
          .select()
          .single();
        user = newUser;
      }

      if (user && user.legacy_email_login) {
        const token = AuthService.generateToken(user.id);
        return res.status(200).json({
          success: true,
          data: { user, token, authMethod: 'legacy' }
        });
      }
    }

    // Regular sign in
    const result = await AuthService.signIn(email, password);
    
    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
}

export default withAuth(handler, { public: true });
