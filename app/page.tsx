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
      console.log('🔐 Creating/verifying user:', email);
      
      // Create or verify user in database first
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: email.split('@')[0] // Use email username as default name
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user account');
      }

      console.log('✅ User created/verified:', result.data.user.email);
      
      // Store user info in localStorage
      localStorage.setItem('userEmail', email.trim());
      localStorage.setItem('userName', result.data.user.name || email.split('@')[0]);
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
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
                <h4 className="font-semibold text-blue-900">Multiple Role</h4>
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
            We never share your data with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
