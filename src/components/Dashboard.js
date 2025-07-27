import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, User, TrendingUp, BarChart3 } from 'lucide-react';

function Dashboard({ userEmail, onStartSession }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await apiService.getScenarios();
      setScenarios(data);
    } catch (err) {
      setError(err.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🔥';
      case 'advanced': return '💪';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666' }}>Loading practice scenarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Error Loading Scenarios</h2>
        <p style={{ color: '#b91c1c', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={loadScenarios}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎯 AI Sales Roleplay
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666',
          marginBottom: '10px'
        }}>
          Practice your sales skills with AI-powered scenarios
        </p>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '10px',
          color: '#888',
          fontSize: '0.9rem'
        }}>
          <User size={16} />
          <span>{userEmail}</span>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Scenario Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  margin: 0,
                  color: '#1f2937',
                  lineHeight: '1.3'
                }}>
                  {scenario.title}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: getDifficultyColor(scenario.difficulty),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  <span>{getDifficultyIcon(scenario.difficulty)}</span>
                  {scenario.difficulty}
                </div>
              </div>
              
              <p style={{ 
                color: '#6b7280', 
                margin: 0,
                lineHeight: '1.5',
                fontSize: '0.95rem'
              }}>
                {scenario.description}
              </p>
            </div>

            {/* Character Info */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#6b7280', 
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  You'll be speaking with:
                </span>
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '4px'
              }}>
                {scenario.character_name}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#6b7280'
              }}>
                {scenario.character_role}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => onStartSession(scenario)}
              style={{
                width: '100%',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a67d8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Play size={18} />
              Start Practice Session
            </button>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        padding: '30px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        color: '#6b7280'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '16px' }}>
          🚀 How It Works
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎤</div>
            <p><strong>Speak Naturally</strong><br />Talk to the AI character using your voice</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
            <p><strong>AI Responds</strong><br />Get realistic responses from AI characters</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
            <p><strong>Get Feedback</strong><br />Receive coaching tips to improve your skills</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
