'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error && message) {
      setError('Google sign-in failed. Please try again.');
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/google?action=login');
      
      if (!response.ok) {
        throw new Error('Failed to initialize Google login');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.authUrl) {
        throw new Error(result.error || 'Failed to initialize Google login');
      }
      
      // Redirect to Google OAuth
      window.location.href = result.authUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Google sign-in failed: ${errorMessage}`);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-white/20">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Ace Your Role
          </h1>
          <h2 className="text-2xl font-bold text-blue-900 mb-3">
            ✨ AI-Powered Professional Training
          </h2>
          <p className="text-blue-700 text-lg leading-relaxed">
            Practice real conversations, get instant feedback, and accelerate your career growth
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Google Sign-In */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Sign in to start practicing
          </h3>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:border-gray-300 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Secure sign-in powered by Google
          </p>
        </div>

        {/* Feature Benefits */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">
            ✨ What You'll Get Access To
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎤</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Natural Voice Practice</h4>
                <p className="text-blue-700 text-sm">Have realistic conversations with AI characters that respond like real people</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">AI-Powered Feedback</h4>
                <p className="text-blue-700 text-sm">Get detailed analysis and personalized coaching after each session</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎭</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Multiple Professional Roles</h4>
                <p className="text-blue-700 text-sm">Practice sales, management, engineering, and leadership scenarios</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Progress Tracking</h4>
                <p className="text-blue-700 text-sm">Monitor your improvement with detailed analytics and skill progression</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Security */}
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
          
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed mb-2">
              🔒 <strong>Secure & Private:</strong> We use Google's secure authentication and never store your passwords.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your practice sessions are automatically deleted after 90 days for privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
