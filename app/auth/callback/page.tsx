'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const [status, setStatus] = useState('processing');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const success = searchParams.get('success');
        const sessionToken = searchParams.get('sessionToken');
        const userParam = searchParams.get('user');
        const isNewUser = searchParams.get('isNewUser') === 'true';

        if (success === 'true' && sessionToken && userParam) {
          const user = JSON.parse(userParam);
          
          console.log('✅ OAuth success, setting up session:', user.email);
          
          // Store user session data
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('userName', user.name);
          localStorage.setItem('userPicture', user.picture || '');
          localStorage.setItem('sessionToken', sessionToken);
          localStorage.setItem('authProvider', 'google');
          
          setStatus('success');
          
          // Small delay to show success state, then redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
          
        } else {
          console.error('❌ OAuth callback missing required parameters');
          setStatus('error');
          
          setTimeout(() => {
            router.push('/?error=oauth_failed');
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        setStatus('error');
        
        setTimeout(() => {
          router.push('/?error=callback_error');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your account...</h2>
            <p className="text-gray-600">Please wait while we complete your Google sign-in</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-white">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Welcome!</h2>
            <p className="text-gray-600">Your account is ready. Redirecting to your dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-white">✗</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue completing your sign-in. You'll be redirected to try again.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
