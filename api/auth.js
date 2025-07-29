import { AuthService, withAuth } from '../lib/auth.js';

// api/auth.js - Add Google OAuth support
async function handleGoogleAuth(req, res) {
  const { credential } = req.body;
  
  try {
    // Verify Google JWT token
    const ticket = await googleAuthClient.verifyIdToken({
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
    
    const token = AuthService.generateToken(user.id);
    res.json({ success: true, data: { user, token } });
    
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
}
async function handler(req, res) {
  const { action } = req.query;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'login':
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        const loginResult = await AuthService.signIn(email, password);
        return res.status(200).json({ success: true, data: loginResult });

      case 'register':
        const { email: regEmail, password: regPassword, fullName, company, role } = req.body;
        if (!regEmail || !regPassword) {
          return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        const registerResult = await AuthService.signUp(regEmail, regPassword, { full_name: fullName, company, role });
        return res.status(201).json({ success: true, data: registerResult });

      case 'verify':
        return res.status(200).json({ success: true, data: { user: req.user, valid: true } });

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: error.message });
  }
}

export default withAuth(handler, { public: true });
