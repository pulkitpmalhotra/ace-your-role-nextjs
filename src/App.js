// Enhanced src/App.js with Week 2 improvements
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RoleplaySession from './components/RoleplaySession';
import EnhancedFeedback from './components/EnhancedFeedback';
import FeedbackDashboard from './components/FeedbackDashboard';
import PrivacyPolicy from './components/PrivacyPolicy';
import MobileNavigation from './components/MobileNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import { useToast } from './components/Toast';
import './App.css';

function App() {
  const [currentState, setCurrentState] = useState('login');
  const [initialDashboardTab, setInitialDashboardTab] = useState('scenarios');
  const [userEmail, setUserEmail] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Toast notifications
  const { ToastContainer, showSuccess, showError, showWarning, showInfo } = useToast();

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
// Add this useEffect near the other useEffects in App.js
useEffect(() => {
  console.log('🔄 App state changed:');
  console.log('  - currentState:', currentState);
  console.log('  - selectedScenario:', selectedScenario?.title);
  console.log('  - userEmail:', userEmail);
}, [currentState, selectedScenario, userEmail]);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance monitoring
  useEffect(() => {
    const logPerformanceMetrics = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          pageLoadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString()
        };

        setPerformanceMetrics(metrics);

        // Send to performance API
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'page-load',
            data: metrics,
            userEmail: userEmail || 'anonymous'
          })
        }).catch(err => {
          console.warn('Failed to log performance metrics:', err);
        });
      }
    };

    // Log initial page load
    if (document.readyState === 'complete') {
      logPerformanceMetrics();
    } else {
      window.addEventListener('load', logPerformanceMetrics);
      return () => window.removeEventListener('load', logPerformanceMetrics);
    }
  }, [userEmail]);

  // Privacy notice check
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('privacyAccepted');
    if (!privacyAccepted) {
      setShowPrivacyNotice(true);
    }
  }, []);

  // Load user data with error handling
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedEmail = sessionStorage.getItem('userEmail');
        const savedState = sessionStorage.getItem('currentState');
        
        if (savedEmail && savedState) {
          console.log('📱 Restoring user session:', savedEmail);
          setUserEmail(savedEmail);
          setCurrentState(savedState === 'session' ? 'dashboard' : savedState);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        showError('Failed to restore your session. Please sign in again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [showInfo, showError]);

  // Save user data with error handling
  useEffect(() => {
    if (userEmail) {
      try {
        sessionStorage.setItem('userEmail', userEmail);
        sessionStorage.setItem('currentState', currentState);
      } catch (error) {
        console.error('Failed to save user data:', error);
        showWarning('Unable to save session data. You may need to sign in again if you refresh the page.');
      }
    }
  }, [userEmail, currentState, showWarning]);

  const handleLogin = (email) => {
    console.log('🔐 User logged in:', email);
    setUserEmail(email);
    setCurrentState('dashboard');
    showSuccess(`Welcome${email ? `, ${email.split('@')[0]}` : ''}! Ready to start practicing?`);
  };

  const handleStartSession = (scenario) => {
  console.log('🎬 handleStartSession called in App.js');
  console.log('📋 Received scenario:', scenario);
  console.log('🆔 Scenario ID:', scenario?.id);
  console.log('📧 Current user email:', userEmail);
  
  // Check if we have all required data
  if (!scenario || !scenario.id) {
    console.error('❌ Invalid scenario data');
    alert('Error: Invalid scenario data');
    return;
  }
  
  if (!userEmail) {
    console.error('❌ No user email available');
    alert('Error: User not logged in');
    return;
  }
  
  console.log('✅ Setting selected scenario and transitioning to session state');
  setSelectedScenario(scenario);
  setCurrentState('session');
  
  // Log performance for analytics
  fetch('/api/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'session-start',
      data: { scenarioId: scenario.id, scenarioTitle: scenario.title },
      userEmail
    })
  }).catch(err => console.warn('Failed to log session start:', err));
};

  const handleEndSession = (targetTab = 'scenarios') => {
    console.log('🏁 Session ended, returning to dashboard with tab:', targetTab);
    setSelectedScenario(null);
    setCurrentState('dashboard');
    setInitialDashboardTab(targetTab);
    showSuccess('Great job! Your session feedback is ready.');
  };

  const handleLogout = () => {
    console.log('👋 User logged out');
    try {
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('currentState');
      
      setUserEmail('');
      setSelectedScenario(null);
      setCurrentState('login');
      
      showInfo('Successfully signed out. Thanks for practicing!');
    } catch (error) {
      console.error('Failed to clear user data:', error);
      showError('Logout may not have completed properly. Please clear your browser data if needed.');
    }
  };

  const handleViewFeedbackDashboard = (initialTab = 'scenarios') => {
    console.log('📊 Opening feedback dashboard with tab:', initialTab);
    setCurrentState('feedback-dashboard');
    setInitialDashboardTab(initialTab);
  };

  const handleShowPrivacyPolicy = () => {
    setCurrentState('privacy-policy');
  };

  const handlePrivacyAccept = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setShowPrivacyNotice(false);
    showSuccess('Privacy settings saved. Thanks for using our platform!');
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyNotice(false);
    setCurrentState('privacy-policy');
  };

  // Mobile tab change handler
  const handleMobileTabChange = (tabId) => {
    setInitialDashboardTab(tabId);
    // Trigger dashboard re-render with new tab
    if (currentState === 'dashboard') {
      // Force re-render by temporarily changing state
      setCurrentState('dashboard-updating');
      setTimeout(() => setCurrentState('dashboard'), 0);
    }
  };

  // Error fallback for the entire app
  const AppErrorFallback = ({ error, resetError }) => (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fee2e2',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>
          Application Error
        </h1>
        <p style={{ marginBottom: '24px' }}>
          The application encountered an unexpected error. This has been reported to our team.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={resetError}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
        
        {/* Performance info for debugging */}
        {performanceMetrics && process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Performance Info (Dev Only)</summary>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
              {JSON.stringify(performanceMetrics, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Loading AI Roleplay Platform...
        </p>
        {performanceMetrics && (
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            Optimizing experience for your device
          </p>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {/* Mobile Navigation */}
        {isMobile && currentState === 'dashboard' && (
          <MobileNavigation
            activeTab={initialDashboardTab}
            onTabChange={handleMobileTabChange}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content */}
        <ErrorBoundary fallback={AppErrorFallback}>
          {currentState === 'login' && (
            <Login 
              onLogin={handleLogin} 
              onShowPrivacy={handleShowPrivacyPolicy}
            />
          )}

          {currentState === 'dashboard' && (
            <Dashboard 
              userEmail={userEmail}
              onStartSession={handleStartSession}
              onViewFeedbackDashboard={handleViewFeedbackDashboard}
              initialTab={initialDashboardTab}
              isMobile={isMobile}
              onShowPrivacy={handleShowPrivacyPolicy}
            />
          )}

          {currentState === 'session' && selectedScenario && (
            <RoleplaySession
              scenario={selectedScenario}
              userEmail={userEmail}
              onEndSession={handleEndSession}
              isMobile={isMobile}
            />
          )}

          {currentState === 'feedback-dashboard' && (
            <FeedbackDashboard 
              userEmail={userEmail}
              initialTab={initialDashboardTab}
              onBack={() => {
                setCurrentState('dashboard');
                setInitialDashboardTab('scenarios');
              }}
              isMobile={isMobile}
            />
          )}

          {currentState === 'privacy-policy' && (
            <PrivacyPolicy 
              onBack={() => {
                setCurrentState(userEmail ? 'dashboard' : 'login');
              }}
            />
          )}
        </ErrorBoundary>
        
        {/* Desktop Logout Button */}
        {!isMobile && currentState === 'dashboard' && (
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
            Sign Out
          </button>
        )}

        {/* Privacy Notice */}
        {showPrivacyNotice && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#1f2937' }}>
              🍪 Privacy Notice
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
              We use essential cookies and collect minimal data to provide our AI training service. 
              Your conversations are encrypted and automatically deleted after 90 days.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handlePrivacyAccept}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Accept
              </button>
              <button
                onClick={handlePrivacyDecline}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastContainer position={isMobile ? 'top-center' : 'top-right'} />

        {/* Mobile spacing for bottom navigation */}
        {isMobile && currentState === 'dashboard' && (
          <div style={{ height: '80px' }} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
