import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, User, TrendingUp, BarChart3, Target, Calendar } from 'lucide-react';

function Dashboard({ userEmail, onStartSession, onViewFeedbackDashboard }) {
  const [scenarios, setScenarios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'progress'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load scenarios
      const scenariosData = await apiService.getScenarios();
      setScenarios(scenariosData);
      
      // Load user sessions for progress tab
      try {
        const sessionsData = await apiService.getUserSessions(userEmail);
        setSessions(sessionsData);
      } catch (sessionError) {
        console.error('Failed to load sessions:', sessionError);
        // Don't fail the whole component if sessions fail
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load data');
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
const handleDownloadReport = async (sessionId) => {
  try {
    console.log('📄 Starting PDF download for session:', sessionId);
    
    // Generate and download PDF
    await apiService.downloadFeedbackReport(sessionId, userEmail);
    
    // Optional: Log the download
    try {
      await fetch('/api/log-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userEmail })
      });
    } catch (logError) {
      console.log('Failed to log download, but PDF was successful');
    }
    
    console.log('✅ PDF downloaded successfully');
    
  } catch (error) {
    console.error('❌ Download error:', error);
    alert('Failed to download report. Please try again.');
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
        <p style={{ color: '#666' }}>Loading dashboard...</p>
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
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Error Loading Dashboard</h2>
        <p style={{ color: '#b91c1c', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={loadData}
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

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('scenarios')}
          style={{
            padding: '15px 30px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'scenarios' ? '3px solid #667eea' : '3px solid transparent',
            color: activeTab === 'scenarios' ? '#667eea' : '#6b7280',
            fontWeight: activeTab === 'scenarios' ? '600' : '400',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Target size={20} />
          Practice Scenarios
        </button>
        
        <button
          onClick={() => setActiveTab('progress')}
          style={{
            padding: '15px 30px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'progress' ? '3px solid #667eea' : '3px solid transparent',
            color: activeTab === 'progress' ? '#667eea' : '#6b7280',
            fontWeight: activeTab === 'progress' ? '600' : '400',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BarChart3 size={20} />
          Progress Dashboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'scenarios' && (
        <div>
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
      )}

      {activeTab === 'progress' && (
        <div>
          {/* Overall Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {sessions.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Sessions</div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                {sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}m
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Practice Time</div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / sessions.length) : 0}m
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Avg Duration</div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={24} />
              Recent Sessions
            </h2>
            
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📈</div>
                <h3 style={{ marginBottom: '8px' }}>No sessions yet</h3>
                <p>Start practicing scenarios to see your progress here!</p>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '16px'
                  }}
                >
                  Start First Session
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
{sessions.slice(0, 10).map((session) => (
  <div key={session.id} style={{
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto', // Added extra column
    gap: '20px',
    alignItems: 'center'
  }}>
    <div style={{
      backgroundColor: '#3b82f6',
      color: 'white',
      width: '50px',
      height: '50px',
      borderRadius: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold'
    }}>
      {session.overall_score ? session.overall_score.toFixed(1) : '✓'}
    </div>
    
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 5px 0' }}>
        {session.scenarios?.title || 'Practice Session'}
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
        {new Date(session.start_time).toLocaleDateString()} • {session.duration_minutes || 0} minutes
      </p>
    </div>
    
    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
      {session.scenarios?.difficulty && (
        <span style={{
          backgroundColor: getDifficultyColor(session.scenarios.difficulty),
          color: 'white',
          padding: '2px 8px',
          borderRadius: '10px',
          textTransform: 'capitalize'
        }}>
          {session.scenarios.difficulty}
        </span>
      )}
    </div>
    
    {/* NEW: Download Button */}
    <button
      onClick={() => handleDownloadReport(session.id)}
      style={{
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
    >
      📄 PDF
    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
