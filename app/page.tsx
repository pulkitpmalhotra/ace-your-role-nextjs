// app/page.tsx - Back to simple email login (working version)
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
              style={{
                appearance: 'none',
                borderRadius: '8px',
                position: 'relative',
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                color: '#111827',
                fontSize: '16px',
                outline: 'none'
              }}
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
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '12px 16px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                borderRadius: '8px',
                color: 'white',
                backgroundColor: (!email || isLoading) ? '#9ca3af' : '#2563eb',
                cursor: (!email || isLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    animation: 'spin 1s linear infinite',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    marginRight: '8px'
                  }}></div>
                  Signing in...
                </div>
              ) : (
                'Start Training'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>✅ Enhanced with Gemini 2.5 (43% cost reduction)</p>
          <p>🎧 Professional speech quality (95%+ accuracy)</p>
          <p>📊 Advanced feedback analysis</p>
          <p>🎙️ Voice conversation mode</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
