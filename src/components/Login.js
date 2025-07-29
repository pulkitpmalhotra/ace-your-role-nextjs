// src/components/Login.js - Updated with complete Ace Your Role branding
import React, { useState } from 'react';
import { Mail, ArrowRight, Play, Zap, Shield } from 'lucide-react';
import { apiService } from '../services/api';

function Login({ onLogin, onShowPrivacy }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🎯 Ace Your Role - Logging in user:', email);
      
      // Store email in sessionStorage immediately
      sessionStorage.setItem('userEmail', email.trim());
      console.log('✅ Email stored in sessionStorage:', sessionStorage.getItem('userEmail'));
      
      // Create/verify user in Supabase
      await apiService.createOrVerifyUser(email.trim());
      
      // Call the login callback
      onLogin(email.trim());
      
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
      
      // Clear sessionStorage on error
      sessionStorage.removeItem('userEmail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.1,
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          fontSize: '4rem',
          animation: 'float 6s ease-in-out infinite'
        }}>🎤</div>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          fontSize: '3rem',
          animation: 'float 6s ease-in-out infinite 2s'
        }}>🎯</div>
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '20%',
          fontSize: '3.5rem',
          animation: 'float 6s ease-in-out infinite 4s'
        }}>💼</div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          fontSize: '2.5rem',
          animation: 'float 6s ease-in-out infinite 1s'
        }}>🧠</div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '50px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Logo/Icon with Animation */}
        <div style={{
          fontSize: '5rem',
          marginBottom: '24px',
          animation: 'bounce 2s infinite'
        }}>
          🎯
        </div>

        {/* Brand Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Ace Your Role
        </h1>
        
        {/* Enhanced Tagline */}
        <p style={{
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '1.2rem',
          lineHeight: '1.5',
          fontWeight: '500'
        }}>
          Master any professional skill with<br />
          <strong style={{ color: '#667eea' }}>AI-powered voice roleplay training</strong>
        </p>

        {/* Value Propositions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '32px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎤</div>
            <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '600' }}>Voice AI</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Real conversations</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '600' }}>Instant Feedback</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>AI coaching</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
            <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '600' }}>From $1</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Pay per use</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

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
              placeholder="Enter your email to start training"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px 18px 18px 50px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
                opacity: loading ? 0.7 : 1,
                fontWeight: '500'
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
              padding: '18px 24px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              opacity: !email.trim() ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading && email.trim()) {
                e.currentTarget.style.backgroundColor = '#5a67d8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
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
                Setting Up Your Account...
              </>
            ) : (
              <>
                <Play size={20} />
                🎁 Start FREE 10-Min Trial
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Enhanced Features Preview */}
        <div style={{
          marginTop: '40px',
          padding: '28px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            ✨ What You'll Experience
          </h3>
          <div style={{
            display: 'grid',
            gap: '16px',
            textAlign: 'left',
            fontSize: '0.95rem',
            color: '#374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎤</span>
              <div>
                <strong>Natural Voice Conversations</strong><br />
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Talk to AI characters that understand and respond naturally
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎭</span>
              <div>
                <strong>Realistic Character Personalities</strong><br />
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Practice with diverse personas across multiple industries
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <div>
                <strong>Detailed Performance Analytics</strong><br />
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Get actionable feedback to improve your skills fast
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <div>
                <strong>Multi-Domain Training</strong><br />
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Sales, leadership, healthcare, support, and more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} />
            <span>GDPR Compliant</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} />
            <span>Instant Access</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💳</span>
            <span>No Credit Card</span>
          </div>
        </div>

        {/* Privacy Note */}
        <p style={{
          marginTop: '24px',
          fontSize: '0.8rem',
          color: '#9ca3af',
          lineHeight: '1.4'
        }}>
          🔒 Your conversations are encrypted and automatically deleted after 90 days.{' '}
          <button
            onClick={onShowPrivacy}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: '600'
            }}
          >
            Privacy Policy
          </button>
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;
