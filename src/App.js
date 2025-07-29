// src/App.js - Complete file with proper React hook patterns
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
  // All useState hooks must be called in the same order every render
  const [currentState, setCurrentState] = useState('login');
  const [initialDashboardTab, setInitialDashboardTab] = useState('scenarios');
  const [userEmail, setUserEmail] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Toast notifications - this hook must always be called
  const { ToastContainer, showSuccess, showError, showWarning, showInfo } = useToast();

  // Mobile detection effect - always runs
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array means this only runs once

  // Performance monitoring effect - always runs
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

        // Send to performance API - wrapped in try/catch to prevent errors
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
  }, [userEmail]); // Dependency on userEmail is fine as it's stable

  // Privacy notice check effect - always runs
  useEffect(() => {
    const privacyAccepted = localStorage.getItem('privacyAccepted');
    if (!privacyAccepted) {
      setShowPrivacyNotice(true);
    }
  }, []); // Empty dependency array

  // Load user data effect - always runs
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedEmail = sessionStorage.getItem('userEmail');
        const savedState = sessionStorage.getItem('currentState');
        
        if (savedEmail && savedState) {
          console.log('Restoring user session:', savedEmail);
          setUserEmail(savedEmail);
          setCurrentState(savedState === 'session' ? 'dashboard' : savedState);
          
          // Show restoration message only if we actually restored something
          showInfo('Welcome back! Your session has been restored.');
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        showError('Failed to restore your session. Please sign in again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty dependency - showInfo and showError are stable functions

  // Save user data effect - depends on userEmail and currentState
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

  // Debugging effect - separate from main logic, always runs
  useEffect(() => {
    console.log('App State Update:', {
      currentState,
      userEmail: userEmail || 'Not set',
      selectedScenario: selectedScenario?.title || 'None',
      isLoading
    });
  }, [currentState, userEmail, selectedScenario, isLoading]);

  // Event handlers - these are stable functions that don't affect hook order
  const handleLogin = (email) => {
    console.log('User logged in:', email);
    setUserEmail(email);
    setCurrentState('dashboard');
    showSuccess(`Welcome${email ? `, ${email.split('@')[0]}` : ''}! Ready to start practicing?`);
  };

  const handleStartSession = (scenario) => {
    console.log('Starting session with scenario:', scenario?.title);
    
    // Simple validation without complex conditionals
    if (!scenario?.id) {
      showError('Invalid scenario selected');
      return;
    }
    
    if (!userEmail) {
      showError('Please log in to start a session');
      return;
    }
    
    // Simple state updates
    setSelectedScenario(scenario);
    setCurrentState('session');
    
    // Log session start for analytics - non-blocking
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
    console.log('Session ended, returning to dashboard with tab:', targetTab);
    setSelectedScenario(null);
    setCurrentState('dashboard');
    setInitialDashboardTab(targetTab);
    showSuccess('Great job! Your session feedback is ready.');
  };

  const handleLogout = () => {
    console.log('User logged out');
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
    console.log('Opening feedback dashboard with tab:', initialTab);
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

  const handleMobileTabChange = (tabId) => {
    setInitialDashboardTab(tabId);
    // Trigger dashboard re-render with new tab
    if (currentState === 'dashboard') {
      // Force re-render by temporarily changing state
      setCurrentState('dashboard-updating');
      setTimeout(() => setCurrentState('dashboard'), 0);
    }
  };

  // Loading screen - simple conditional rendering
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

  // Main render - conditional rendering based on currentState
  return (
    <ErrorBoundary>
      <div className="App">
        {/* Mobile Navigation - only shown for mobile dashboard */}
        {isMobile && currentState === 'dashboard' && (
          <MobileNavigation
            activeTab={initialDashboardTab}
            onTabChange={handleMobileTabChange}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content - conditional rendering that doesn't affect hooks */}
        <ErrorBoundary>
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
        
        {/* Desktop Logout Button - conditional rendering */}
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

        {/* Privacy Notice - conditional rendering */}
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
