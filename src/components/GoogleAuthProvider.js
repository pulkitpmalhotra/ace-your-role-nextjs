import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function GoogleAuthProvider({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

export function GoogleLoginButton({ onSuccess, onError }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      
      const result = await response.json();
      if (result.success) {
        onSuccess(result.data);
      } else {
        onError(result.error);
      }
    } catch (error) {
      onError('Google login failed');
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => onError('Google login failed')}
      useOneTap={true}
      auto_select={false}
      disabled={loading || googleLoading}
    />
  );
}

export default GoogleAuthProvider;
