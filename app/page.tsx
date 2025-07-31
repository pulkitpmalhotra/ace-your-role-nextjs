'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Store user email in localStorage
      localStorage.setItem('userEmail', email);
      
      // Navigate to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPrivacy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Privacy Policy & Data Usage</h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-gray-500 hover:text-gray-700 text-xl transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🛡️</span>
                  Your Data is Protected
                </h3>
                <p className="text-blue-800 mb-4">We use industry-standard security measures to protect your information:</p>
                <ul className="list-disc pl-6 text-blue-800 space-y-2">
                  <li>End-to-end encryption for all conversations</li>
                  <li>Secure cloud storage with automatic backups</li>
                  <li>No data sharing with third parties without consent</li>
                  <li>GDPR compliant data handling</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    What We Collect
                  </h3>
                  <ul className="list-disc pl-6 text-green-800 space-y-2">
                    <li>Email address for account management</li>
                    <li>Conversation transcripts for feedback</li>
                    <li>Performance metrics for progress tracking</li>
                    <li>Usage analytics to improve our service</li>
                  </ul>
                </div>

                <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="mr-2">⚖️</span>
                    Your Rights
                  </h3>
                  <ul className="list-disc pl-6 text-purple-800 space-y-2">
                    <li>Access and download your data anytime</li>
                    <li>Correct any inaccurate information</li>
                    <li>Delete your account and all data</li>
                    <li>Control how your data is used</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span className="mr-2">🚀</span>
                  Enhanced AI Training
                </h3>
                <p className="text-indigo-100">
                  Your conversations help us improve AI responses while maintaining your privacy. 
                  All data is anonymized and used solely to enhance the training experience.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowPrivacy(false)}
                className="btn-primary btn-lg"
              >
                I Understand & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="card p-8 animate-fade-in">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 shadow-medium">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Ace Your Role
            </h1>
            <p className="text-lg text-gray-600">
              AI-Powered Roleplay Training
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  43% Cost Reduction
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                  Voice AI
                </span>
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                className="input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full btn-lg group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  Start Training
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              )}
            </button>
          </form>

          {/* Features highlight */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-sm text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                Privacy Policy & Data Usage
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-2xl mb-1">🤖</div>
                <div className="text-xs font-medium text-blue-900">Gemini 2.5</div>
                <div className="text-xs text-blue-600">Flash-Lite</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-2xl mb-1">🎤</div>
                <div className="text-xs font-medium text-green-900">Voice AI</div>
                <div className="text-xs text-green-600">95% Accuracy</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-xs font-medium text-purple-900">Smart Feedback</div>
                <div className="text-xs text-purple-600">AI Analysis</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs font-medium text-orange-900">Scenarios</div>
                <div className="text-xs text-orange-600">Multi-Industry</div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 text-center">
            <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
              <span className="flex items-center">
                <span className="text-green-500 mr-1">🔒</span>
                Encrypted
              </span>
              <span className="flex items-center">
                <span className="text-blue-500 mr-1">🛡️</span>
                GDPR Safe
              </span>
              <span className="flex items-center">
                <span className="text-purple-500 mr-1">⚡</span>
                Instant Setup
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
