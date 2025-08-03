'use client';

// Alternative: Google Identity Services approach
// Add this to your app/page.tsx or create a new login component
// Make sure to set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface GSILoginProps {
  clientId?: string;
}

export default function GSILoginPage({ clientId }: GSILoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    const loadGSI = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Identity Services loaded');
        setGsiLoaded(true);
        initializeGSI();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Identity Services');
        setError('Failed to load Google authentication. Please refresh and try again.');
      };
      document.head.appendChild(script);
    };

    if (!window.google) {
      loadGSI();
    } else {
      setGsiLoaded(true);
      initializeGSI();
    }
  }, []);

  const initializeGSI = () => {
    if (!window.google?.accounts) {
      console.error('❌ Google accounts not available');
      return;
    }

    try {
      // Initialize the GSI client for authorization code flow
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId || '76211479926-qduqpogrlm6thaqjth125oh6erci3818.apps.googleusercontent.com',
        scope: 'openid email profile',
        ux_mode: 'redirect',
        redirect_uri: 'https://ace-your-role-nextjs.vercel.app/api/auth/google/callback',
        callback: (response: any) => {
          console.log('📥 GSI Response:', response);
          if (response.code) {
            // This handles the authorization code
            handleAuthCode(response.code);
          } else if (response.error) {
            console.error('❌ GSI Error:', response.error);
            setError(`Google authentication failed: ${response.error}`);
          }
        },
        error_callback: (error: any) => {
          console.error('❌ GSI Error Callback:', error);
          setError(`Google authentication error: ${error.type || 'Unknown error'}`);
          setIsLoading(false);
        }
      });

      // Store client for use in login function
      (window as any).gsiClient = client;
      console.log('✅ GSI client initialized');

    } catch (error) {
      console.error('❌ GSI initialization error:', error);
      setError('Failed to initialize Google authentication.');
    }
  };

  const handleGSILogin = () => {
    if (!(window as any).gsiClient) {
      setError('Google authentication not ready. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Requesting GSI authorization...');
      (window as any).gsiClient.requestCode();
    } catch (error) {
      console.error('❌ GSI request error:', error);
      setError('Failed to start Google authentication.');
      setIsLoading(false);
    }
  };

  const handleAuthCode = async (code: string) => {
    try {
      console.log('🔄 Processing authorization code...');
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const result = await response.json();

      if (result.success) {
        // Store user session data
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userName', result.user.name);
        localStorage.setItem('userPicture', result.user.picture || '');
        localStorage.setItem('sessionToken', result.sessionToken);
        localStorage.setItem('authProvider', 'google');
        
        console.log('✅ GSI OAuth success, redirecting to dashboard');
        window.location.href = '/dashboard';
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Auth code processing error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual URL test (backup method)
  const testManualOAuth = async () => {
    try {
      const response = await fetch('/api/auth/google?action=login');
      const result = await response.json();
      
      if (result.success && result.authUrl) {
        console.log('🔗 Testing manual OAuth URL:', result.authUrl);
        window.location.href = result.authUrl;
      } else {
        setError('Failed to generate OAuth URL');
      }
    } catch (error) {
      console.error('❌ Manual OAuth test error:', error);
      setError('Failed to test OAuth URL');
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
            ✨ OAuth Debug Mode
          </h2>
          <p className="text-blue-700 text-lg leading-relaxed">
            Testing different OAuth approaches to fix the "response_type missing" error
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* GSI Status */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-700 text-sm">
            <strong>Google Identity Services:</strong> {gsiLoaded ? '✅ Loaded' : '⏳ Loading...'}
          </p>
          <p className="text-gray-700 text-sm">
            <strong>GSI Client:</strong> {(window as any)?.gsiClient ? '✅ Ready' : '❌ Not Ready'}
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          
          {/* Method 1: Google Identity Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🚀 Method 1: Google Identity Services
            </h3>
            <button
              onClick={handleGSILogin}
              disabled={isLoading || !gsiLoaded}
              className="w-full bg-green-500 border-2 border-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Try Google Identity Services
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Uses Google&apos;s latest OAuth library (handles response_type automatically)
            </p>
          </div>

          {/* Method 2: Manual URL Construction */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🔧 Method 2: Manual URL Construction
            </h3>
            <button
              onClick={testManualOAuth}
              disabled={isLoading}
              className="w-full bg-blue-500 border-2 border-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-lg"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Try Manual URL Construction
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Builds OAuth URL manually to ensure all parameters are included
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">🔍 Debug Information</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• GSI Library: {gsiLoaded ? 'Loaded' : 'Loading...'}</li>
            <li>• Client ID: {clientId ? 'Set via prop' : 'Using default'}</li>
            <li>• Method 1 uses GSI redirect mode (no response_type needed)</li>
            <li>• Method 2 manually includes response_type=code</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
