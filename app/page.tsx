'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting Google sign-in...');
      
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      if (result?.error) {
        console.error('❌ Google sign-in error:', result.error);
        alert('Google sign-in failed. Please try again.');
      } else if (result?.url) {
        console.log('✅ Google sign-in successful, redirecting...');
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('❌ Sign-in error:', error);
      alert('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // For backward compatibility, store email in localStorage
    localStorage.setItem('userEmail', email);
    router.push('/dashboard');
  };

  if (showPrivacy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Privacy Policy & Data Usage</h2>
            <button
              onClick={() => setShowPrivacy(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="prose max-w-none space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Google OAuth Integration</h3>
              <p className="text-gray-600 mb-4">When you sign in with Google, we collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your name and email address for account creation</li>
                <li>Profile picture for personalization</li>
                <li>Email verification status for security</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data We Store</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Conversation transcripts to provide personalized feedback</li>
                <li>Session performance data to track your progress</li>
                <li>User preferences and settings</li>
                <li>Usage analytics to improve our service</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Rights (GDPR Compliant)</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> View all data we have about you</li>
                <li><strong>Rectification:</strong> Correct any inaccurate information</li>
                <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                <li><strong>Erasure:</strong> Delete your account and all associated data</li>
                <li><strong>Restrict Processing:</strong> Limit how we use your data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Security</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>All data encrypted in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>No data sharing with third parties without consent</li>
                <li>Automatic data retention policies (conversations deleted after 2 years)</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Contact:</strong> For any privacy concerns or to exercise your rights, 
                contact us at privacy@aceyourrole.com or use the data management tools in your dashboard.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowPrivacy(false)}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Ace Your Role
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            AI-Powered Roleplay Training Platform
          </p>
        </div>

        <div className="space-y-6">
          {/* Google OAuth Sign-In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign-In */}
          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              📧 Use Email Instead
            </button>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Continue with Email
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Back to Google Sign-In
              </button>
            </form>
          )}

          {/* Privacy & Features */}
          <div className="text-center">
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-sm text-blue-600 hover:text-blue-500 underline mb-4"
            >
              Privacy Policy & Data Usage
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>✅ Enhanced with Gemini 2.5 (43% cost reduction)</p>
            <p>🎧 Professional speech quality (95%+ accuracy)</p>
            <p>📊 Advanced feedback analysis</p>
            <p>🔒 GDPR compliant data management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
