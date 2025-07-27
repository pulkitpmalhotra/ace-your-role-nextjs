import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RoleplaySession from './components/RoleplaySession';
import './App.css';

function App() {
  const [currentState, setCurrentState] = useState('login'); // 'login' | 'dashboard' | 'session'
  const [userEmail, setUserEmail] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleLogin = (email) => {
    setUserEmail(email);
    setCurrentState('dashboard');
  };

  const handleStartSession = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentState('session');
  };

  const handleEndSession = () => {
    setSelectedScenario(null);
    setCurrentState('dashboard');
  };

  const handleLogout = () => {
    setUserEmail('');
    setSelectedScenario(null);
    setCurrentState('login');
  };

  return (
    <div className="App">
      {currentState === 'login' && (
        <Login onLogin={handleLogin} />
      )}

      {currentState === 'dashboard' && (
        <Dashboard 
          userEmail={userEmail}
          onStartSession={handleStartSession}
        />
      )}

      {currentState === 'session' && selectedScenario && (
        <RoleplaySession
          scenario={selectedScenario}
          userEmail={userEmail}
          onEndSession={handleEndSession}
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
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
}

export default App;
