import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RoleplaySession from './components/RoleplaySession';
import EnhancedFeedback from './components/EnhancedFeedback';
import FeedbackDashboard from './components/FeedbackDashboard';
import './App.css';

function App() {
  const [currentState, setCurrentState] = useState('login'); // 'login' | 'dashboard' | 'session' | 'feedback-dashboard'
  const [userEmail, setUserEmail] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const handleViewFeedbackDashboard = () => {
  console.log('📊 Opening feedback dashboard');
  setCurrentState('feedback-dashboard');
};
  // Load user data on app start
  useEffect(() => {
    const loadUserData = () => {
      try {
        // Try to get user from sessionStorage (survives tab refresh but not browser close)
        const savedEmail = sessionStorage.getItem('userEmail');
        const savedState = sessionStorage.getItem('currentState');
        
        if (savedEmail && savedState) {
          console.log('📱 Restoring user session:', savedEmail);
          setUserEmail(savedEmail);
          setCurrentState(savedState === 'session' ? 'dashboard' : savedState); // Don't restore session state
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Save user data when it changes
  useEffect(() => {
    if (userEmail) {
      try {
        sessionStorage.setItem('userEmail', userEmail);
        sessionStorage.setItem('currentState', currentState);
      } catch (error) {
        console.error('Failed to save user data:', error);
      }
    }
  }, [userEmail, currentState]);

  const handleLogin = (email) => {
    console.log('🔐 User logged in:', email);
    setUserEmail(email);
    setCurrentState('dashboard');
  };

  const handleStartSession = (scenario) => {
    console.log('🎬 Starting session with scenario:', scenario.title);
    setSelectedScenario(scenario);
    setCurrentState('session');
  };

  const handleEndSession = () => {
    console.log('🏁 Session ended, returning to dashboard');
    setSelectedScenario(null);
    setCurrentState('dashboard');
  };

  const handleLogout = () => {
    console.log('👋 User logged out');
    try {
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('currentState');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
    
    setUserEmail('');
    setSelectedScenario(null);
    setCurrentState('login');
  };

  // Show loading screen while checking for saved user
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading AI Roleplay...</p>
        </div>
      </div>
    );
  }

 return (
  <div className="App">
    {currentState === 'login' && (
      <Login onLogin={handleLogin} />
    )}

    {currentState === 'dashboard' && (
      <Dashboard 
        userEmail={userEmail}
        onStartSession={handleStartSession}
        onViewFeedbackDashboard={handleViewFeedbackDashboard}
      />
    )}

    {currentState === 'session' && selectedScenario && (
      <RoleplaySession
        scenario={selectedScenario}
        userEmail={userEmail}
        onEndSession={handleEndSession}
      />
    )}

    {currentState === 'feedback-dashboard' && (
      <FeedbackDashboard 
        userEmail={userEmail}
        onBack={() => setCurrentState('dashboard')}
      />
    )}

    {/* Logout button - always visible when logged in */}
    {currentState !== 'login' && (
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ef4444';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Logout
      </button>
    )}
  </div>
);
export default App;
