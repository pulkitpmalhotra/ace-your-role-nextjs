// src/components/Dashboard.js - Complete file with proper button handling
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, User, TrendingUp, BarChart3, Target, Calendar, Loader } from 'lucide-react';
import ScenarioFilters from './ScenarioFilters';

function Dashboard({ userEmail, onStartSession, onViewFeedbackDashboard, initialTab, isMobile, onShowPrivacy }) {
  // All useState hooks must be called in the same order every render
  const [scenarios, setScenarios] = useState([]);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('scenarios');
  const [metadata, setMetadata] = useState({});

  // Initial data loading effect - always runs once
  useEffect(() => {
    loadInitialData();
  }, []); // Empty dependency array

  // Tab preference loading effect - always runs once
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]); // Dependency on initialTab prop

  // Load initial data function
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load scenarios with default filters
      await loadScenarios();
      
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

  // Load scenarios function
  const loadScenarios = async (filters = {}) => {
    try {
      setScenariosLoading(true);
      console.log('Loading scenarios with filters:', filters);
      
      // Call API with filters
      const response = await apiService.getScenariosWithFilters(filters);
      
      console.log('Scenarios loaded:', response);
      setScenarios(response.data || []);
      setFilteredScenarios(response.data || []);
      setMetadata(response.meta || {});
      
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError(err.message || 'Failed to load scenarios');
    } finally {
      setScenariosLoading(false);
    }
  };

  // Filter change handler
  const handleFiltersChange = (filters) => {
    console.log('Filters changed:', filters);
    loadScenarios(filters);
  };

  // Button click handler - clean and simple
  const handleStartSession = (scenario) => {
    console.log('Dashboard: Start session button clicked for:', scenario.title);
    
    // Simple validation
    if (!scenario || !scenario.id) {
      console.error('Invalid scenario data');
      return;
    }
    
    // Call the parent function
    onStartSession(scenario);
  };

  // PDF download handler
  const handleDownloadReport = async (sessionId) => {
    try {
      console.log('Starting PDF download for session:', sessionId);
      await apiService.downloadFeedbackReport(sessionId, userEmail);
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  // Utility functions for display
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'sales': return '💼';
      case 'leadership': return '👑';
      case 'healthcare': return '🏥';
      case 'support': return '🎧';
      case 'legal': return '⚖️';
      default: return '📋';
    }
  };

  const getSubcategoryDisplay = (subcategory) => {
    if (!subcategory) return '';
    return subcategory.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Loading state
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

  // Error state
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
          onClick={loadInitialData}
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

  // Main render
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
          {/* Search and Filters */}
          <ScenarioFilters 
            onFiltersChange={handleFiltersChange}
            metadata={metadata}
          />

          {/* Loading indicator for scenarios */}
          {scenariosLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              gap: '10px'
            }}>
              <Loader size={20} className="animate-spin" />
              <span>Loading scenarios...</span>
            </div>
          )}

          {/* Scenarios Grid */}
          {!scenariosLoading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {filteredScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '400px'
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
                        {getCategoryIcon(scenario.category)} {scenario.title}
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
                    
                    {/* Category and Subcategory Tags */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '12px',
                      flexWrap: 'wrap'
                    }}>
                      {scenario.category && (
                        <span style={{
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {scenario.category}
                        </span>
                      )}
                      {scenario.subcategory && (
                        <span style={{
                          backgroundColor: '#f3e8ff',
                          color: '#6b21a8',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getSubcategoryDisplay(scenario.subcategory)}
                        </span>
                      )}
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
                    
                    {/* Estimated Duration */}
                    {scenario.estimated_duration_minutes && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280',
                        marginTop: '8px'
                      }}>
                        ⏱️ ~{scenario.estimated_duration_minutes} minutes
                      </div>
                    )}
                  </div>

                  {/* Learning Objectives */}
                  {scenario.learning_objectives && scenario.learning_objectives.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        Learning Goals:
                      </div>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '16px', 
                        fontSize: '0.85rem',
                        color: '#4b5563'
                      }}>
                        {scenario.learning_objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Flexible spacer to push button to bottom */}
                  <div style={{ flexGrow: 1 }}></div>

                  {/* Start Button - positioned at bottom */}
                  <button
                    onClick={() => handleStartSession(scenario)}
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
          )}

          {/* Empty State */}
          {!scenariosLoading && filteredScenarios.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '10px', 
                color: '#374151' 
              }}>
                No scenarios found
              </h3>
              <p style={{ 
                color: '#6b7280', 
                marginBottom: '20px',
                fontSize: '1.1rem'
              }}>
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => handleFiltersChange({})}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Show All Scenarios
              </button>
            </div>
          )}

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
                <p><strong>Get Feedback</strong><br />Receive detailed coaching tips to improve</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div>
          {/* Stats Overview with Visual Elements */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Total Sessions Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                borderRadius: '0 12px 0 60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🎯</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
                {sessions.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '12px' }}>Total Sessions</div>
              <div style={{ 
                height: '4px', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '2px',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  width: `${Math.min(100, (sessions.length / 10) * 100)}%`,
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
            
            {/* Average Score Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '0 12px 0 60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>⭐</span>
              </div>
              {(() => {
                const sessionsWithScores = sessions.filter(s => s.overall_score);
                const avgScore = sessionsWithScores.length > 0 ? 
                  sessionsWithScores.reduce((acc, s) => acc + s.overall_score, 0) / sessionsWithScores.length : 0;
                return (
                  <>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                      {avgScore.toFixed(1)}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '12px' }}>Average Score</div>
                    <div style={{ 
                      height: '4px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '2px',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: avgScore >= 4 ? '#10b981' : avgScore >= 3 ? '#f59e0b' : '#ef4444',
                        borderRadius: '2px',
                        width: `${(avgScore / 5) * 100}%`,
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* Practice Time Card */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '0 12px 0 60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>⏱️</span>
              </div>
              {(() => {
                const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return (
                  <>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
                      {hours > 0 ? `${hours}h ${minutes}m` : `${totalMinutes}m`}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '12px' }}>Practice Time</div>
                    <div style={{ 
                      height: '4px', 
                      backgroundColor: '#e5e7eb', 
                      borderRadius: '2px',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#f59e0b',
                        borderRadius: '2px',
                        width: `${Math.min(100, (totalMinutes / 120) * 100)}%`,
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                  </>
                );
              })()}
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
                    gridTemplateColumns: 'auto 1fr auto auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      backgroundColor: session.overall_score ? 
                        (session.overall_score >= 4 ? '#22c55e' : 
                         session.overall_score >= 3 ? '#f59e0b' : 
                         session.overall_score >= 2 ? '#f97316' : '#ef4444') : '#6b7280',
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
                        {session.scenarios?.category && (
                          <span> • {getCategoryIcon(session.scenarios.category)} {session.scenarios.category}</span>
                        )}
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
