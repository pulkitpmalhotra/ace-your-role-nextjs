'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      localStorage.setItem('userEmail', email);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-white/20">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Ace Your Role
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Roleplay Training
          </p>
        </div>

        {/* Form */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Start Training
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </form>

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🤖</div>
            <div className="text-xs font-semibold text-blue-900">Gemini 2.5</div>
            <div className="text-xs text-blue-600">43% Savings</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🎤</div>
            <div className="text-xs font-semibold text-green-900">Voice AI</div>
            <div className="text-xs text-green-600">95% Accuracy</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs font-semibold text-purple-900">Smart Feedback</div>
            <div className="text-xs text-purple-600">AI Analysis</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs font-semibold text-orange-900">Scenarios</div>
            <div className="text-xs text-orange-600">Multi-Industry</div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex justify-center items-center space-x-6 text-xs text-gray-500">
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
            Instant
          </span>
        </div>
      </div>
    </div>
  );
}
