import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Simulate a brief loading period for better UX
    setTimeout(() => {
      onLogin(email.trim());
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {/* Logo/Icon */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px'
        }}>
          🎯
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          AI Sales Roleplay
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '1.1rem',
          lineHeight: '1.5'
        }}>
          Practice your sales skills with AI-powered conversations
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            position: 'relative',
            marginBottom: '24px'
          }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}>
              <Mail size={20} />
            </div>
            
            <input
              type="email"
              placeholder="Enter your email to get started"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px 16px 16px 48px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!email.trim() || loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              opacity: !email.trim() ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && email.trim()) {
                e.currentTarget.style.backgroundColor = '#5a67d8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Getting Ready...
              </>
            ) : (
              <>
                Start Practicing
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Features */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151'
          }}>
            ✨ What You'll Get
          </h3>
          <div style={{
            display: 'grid',
            gap: '12px',
            textAlign: 'left',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎤</span> Voice-based roleplay sessions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖</span> AI characters that respond naturally
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Instant feedback and coaching tips
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🆓</span> Completely free to use
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <p style={{
          marginTop: '24px',
          fontSize: '0.8rem',
          color: '#9ca3af',
          lineHeight: '1.4'
        }}>
          We only use your email to save your practice sessions. No spam, ever.
        </p>
      </div>
    </div>
  );
}

export default Login;
