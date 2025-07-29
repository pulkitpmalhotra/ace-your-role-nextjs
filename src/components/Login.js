// Update src/components/Login.js
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function Login({ onLogin }) {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="login-container">
        {/* Existing email login */}
        <div className="email-login">...</div>
        
        {/* New Google OAuth */}
        <div className="oauth-divider">
          <span>or</span>
        </div>
        
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={handleGoogleError}
          useOneTap={true}
          auto_select={true}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

async function handleGoogleLogin(credentialResponse) {
  const decoded = jwt.decode(credentialResponse.credential);
  await apiService.authenticateWithGoogle({
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    googleId: decoded.sub
  });
  onLogin(decoded.email);
}
