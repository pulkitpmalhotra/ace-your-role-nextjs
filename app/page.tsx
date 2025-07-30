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
      // Store user email in localStorage for now
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
            <button
              onClick={() => setShowPrivacy(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. This application:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Stores conversation data to provide feedback and improve your experience</li>
              <li>Uses your email only for session management and progress tracking</li>
              <li>Does not share your personal information with third parties</li>
              <li>Allows you to delete your data at any time</li>
              <li>Uses industry-standard security measures to protect your information</li>
            </ul>
            <p className="text-gray-600 mt-4">
              By using this application, you consent to our data practices as described above.
            </p>
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

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Start Training'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              Privacy Policy
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>✅ Enhanced with Gemini 2.5 (43% cost reduction)</p>
          <p>🎧 Professional speech quality</p>
          <p>📊 Advanced feedback analysis</p>
        </div>
      </div>
    </div>
  );
}
