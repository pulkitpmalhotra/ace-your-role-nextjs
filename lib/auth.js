import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export class AuthService {
  // Backward compatible authentication - supports both old email-only and new JWT
  static async authenticateRequest(req) {
    try {
      // Try JWT authentication first
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();
          
        if (user) {
          return { user, authMethod: 'jwt' };
        }
      }

      // Fallback to legacy email-only authentication
      const userEmail = req.headers['x-user-email'] || req.body?.userEmail;
      if (userEmail) {
        // Check if user exists, create if not (for backward compatibility)
        let { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (!user) {
          // Create user for backward compatibility
          const { data: newUser } = await supabase
            .from('users')
            .insert({ 
              email: userEmail, 
              legacy_email_login: true,
              email_verified: true 
            })
            .select()
            .single();
          user = newUser;
        }

        return { user, authMethod: 'legacy' };
      }

      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Sign up new user (optional - for future use)
  static async signUp(email, password, userData = {}) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        throw new Error('User already exists');
      }

      // Create new user
      const passwordHash = await this.hashPassword(password);
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          ...userData,
          legacy_email_login: false,
          email_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      const token = this.generateToken(user.id);
      return { user, token };
    } catch (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }
  }

  // Sign in user
  static async signIn(email, password) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // If legacy user without password, allow email-only login
      if (user.legacy_email_login && !user.password_hash) {
        const token = this.generateToken(user.id);
        return { user, token };
      }

      // Verify password for new users
      if (!user.password_hash || !await this.verifyPassword(password, user.password_hash)) {
        throw new Error('Invalid credentials');
      }

      const token = this.generateToken(user.id);
      return { user, token };
    } catch (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }

  // Rate limiting helper
  static async checkRateLimit(identifier, maxRequests = 100, windowMs = 3600000) {
    // For now, return true. Implement Redis-based rate limiting later
    return true;
  }
}

// Middleware function for API routes
export const withAuth = (handler, options = {}) => {
  return async (req, res) => {
    try {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      // Rate limiting
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const rateLimitPassed = await AuthService.checkRateLimit(clientIP);
      if (!rateLimitPassed) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      }

      // Authentication (optional for some routes)
      if (!options.public) {
        const authResult = await AuthService.authenticateRequest(req);
        if (!authResult) {
          return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        req.user = authResult.user;
        req.authMethod = authResult.authMethod;
      }

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Middleware error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};
