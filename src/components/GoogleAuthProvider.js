// /components/GoogleAuthProvider.jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export function AuthProvider({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      
      const data = await response.json();
      if (data.success) {
        // Store user data and redirect
        localStorage.setItem('userEmail', data.email);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      {/* Google Login Button */}
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError('Google login failed')}
        useOneTap={true}
        auto_select={false}
        disabled={isLoading || googleLoading}
      />
      
      {/* Divider */}
      <div className="login-divider">
        <span>or continue with email</span>
      </div>
      
      {/* Existing email form */}
      <form onSubmit={handleEmailSubmit}>
        {/* ... existing form code ... */}
      </form>
    </div>
  );
}
