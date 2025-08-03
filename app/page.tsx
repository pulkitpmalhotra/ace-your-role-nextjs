'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error) {
      switch (error) {
        case 'oauth_error':
          setError('Google sign-in failed. Please try again.');
          break;
        case 'oauth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'callback_error':
          setError('There was an issue completing sign-in. Please try again.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔐 Creating/verifying user with email:', email);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: email.split('@')[0]
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user account');
      }

      console.log('✅ Email user created/verified:', result.data.user.email);
      
      // Store user info in localStorage
      localStorage.setItem('userEmail', email.trim());
      localStorage.setItem('userName', result.data.user.name || email.split('@')[0]);
      localStorage.setItem('authProvider', 'email');
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Email login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      setError(`Login failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      console.log('🔐 Initiating Google OAuth...');
      
      const response = await fetch('/api/auth/google?action=login');
      const result = await response.json();
      
      if (!result.success || !result.authUrl) {
        throw new Error('Failed to initialize Google login');
      }
      
      console.log('✅ Redirecting to Google OAuth...');
      
      // Redirect to Google OAuth
      window.location.href = result.authUrl;
      
    } catch (error) {
      console.error('❌ Google login error:', error);
      setError('Google sign-in is temporarily unavailable. Please try email login.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 border border-white/20">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Ace Your Role
          </h1>
          <h2 className="text-2xl font-bold text-blue-900 mb-3">
            ✨ AI-Powered Professional Training Platform
          </h2>
          <p className="text-blue-700 text-lg">
            Practice real conversations, get instant feedback, and accelerate your career growth
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Auth Options */}
        <div className="space-y-6 max-w-md mx-auto">
          
          {/* Google Sign-In */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:border-gray-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Setting up your account...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Start Free Practice
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* User Benefits */}
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
            ✨ What You'll Get
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎤</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Natural Voice Practice</h4>
                <p className="text-blue-700 text-sm">Have real conversations with AI characters that respond like actual people</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Instant Performance Feedback</h4>
                <p className="text-blue-700 text-sm">Get detailed analysis of your communication skills after each session</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎭</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Multiple Roles</h4>
                <p className="text-blue-700 text-sm">Practice sales, product managers, project managers, technical program managers, managers, leaders, and strategy leads scenarios</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Track Your Progress</h4>
                <p className="text-blue-700 text-sm">See your improvement over time with detailed analytics and coaching tips</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Privacy */}
        <div className="mt-6">
          <div className="flex justify-center items-center space-x-6 text-xs text-gray-500 mb-4">
            <span className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Free to Start
            </span>
            <span className="flex items-center">
              <span className="text-blue-500 mr-1">✓</span>
              No Credit Card
            </span>
            <span className="flex items-center">
              <span className="text-purple-500 mr-1">✓</span>
              Instant Access
            </span>
          </div>
          
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            🔒 Your practice sessions are automatically deleted after 90 days for your privacy.
            <br />
            We never share your data with third parties. Google sign-in is secure and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
