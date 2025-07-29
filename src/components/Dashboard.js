import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, User, TrendingUp, BarChart3, Target, Calendar, Loader } from 'lucide-react';
import ScenarioFilters from './ScenarioFilters';

function Dashboard({
  userEmail,
  onStartSession,
  onViewFeedbackDashboard,
  initialTab,
  isMobile,
  onShowPrivacy
}) {
  const [state, setState] = useState({
    scenarios: [],
    filteredScenarios: [],
    sessions: [],
    loading: true,
    scenariosLoading: false,
    error: '',
    activeTab: 'scenarios',
    metadata: {}
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setState(prev => ({ ...prev, activeTab: initialTab }));
    }
  }, [initialTab]);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await loadScenarios();
      
      try {
        const sessionsData = await apiService.getUserSessions(userEmail);
        setState(prev => ({ ...prev, sessions: sessionsData }));
      } catch (sessionError) {
        console.error('Failed to load sessions:', sessionError);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadScenarios = async (filters = {}) => {
    try {
      setState(prev => ({ ...prev, scenariosLoading: true }));
      console.log('Loading scenarios with filters:', filters);
      
      const response = await apiService.getScenariosWithFilters(filters);
      
      console.log('Scenarios loaded:', response);
      setState(prev => ({
        ...prev,
        scenarios: response.data || [],
        filteredScenarios: response.data || [],
        metadata: response.meta || {}
      }));
      
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scenarios';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, scenariosLoading: false }));
    }
  };

  const handleFiltersChange = (filters) => {
    console.log('Filters changed:', filters);
    loadScenarios(filters);
  };

  const handleStartSession = (scenario) => {
    console.log('Dashboard: Start session button clicked for:', scenario.title);
    
    if (!scenario || !scenario.id) {
      console.error('Invalid scenario data');
      return;
    }
    
    onStartSession(scenario);
  };

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

  // Helper function to get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return '#10b981'; // Green
      case 'intermediate':
        return '#f59e0b'; // Yellow
      case 'advanced':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  // Helper function to get category emoji
  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'sales':
        return '💼';
      case 'leadership':
        return '👥';
      case 'healthcare':
        return '🏥';
      case 'support':
        return '🎧';
      case 'legal':
        return '⚖️';
      default:
        return '🎯';
    }
  };

  // Loading screen
  if (state.loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (state.error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Error Loading Dashboard</h2>
        <p style={{ color: '#b91c1c', marginBottom: '20px' }}>{state.error}</p>
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          🎯 Ace Your Role
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Master professional skills with AI-powered roleplay training
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '30px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'scenarios' }))}
          style={{
            padding: '12px 24px',
            backgroundColor: state.activeTab === 'scenarios' ? '#667eea' : 'transparent',
            color: state.activeTab === 'scenarios' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Target size={20} />
          Practice Scenarios
        </button>
        
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'progress' }))}
          style={{
            padding: '12px 24px',
            backgroundColor: state.activeTab === 'progress' ? '#667eea' : 'transparent',
            color: state.activeTab === 'progress' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <BarChart3 size={20} />
          Progress Dashboard
        </button>
      </div>

      {/* Tab Content */}
      {state.activeTab === 'scenarios' && (
        <div>
          {/* Scenario Filters */}
          <ScenarioFilters 
            onFiltersChange={handleFiltersChange}
            metadata={state.metadata}
          />

          {/* Scenarios Loading */}
          {state.scenariosLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader className="animate-spin" size={40} style={{ margin: '0 auto 20px' }} />
              <p>Loading scenarios...</p>
            </div>
          )}

          {/* Scenarios Grid */}
          {!state.scenariosLoading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {state.filteredScenarios.map((scenario) => (
                <div key={scenario.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Scenario Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '2rem' }}>
                        {getCategoryEmoji(scenario.category)}
                      </span>
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          margin: '0 0 4px 0',
                          color: '#1f2937'
                        }}>
                          {scenario.title}
                        </h3>
                        <span style={{
                          backgroundColor: getDifficultyColor(scenario.difficulty),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {scenario.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Character Info */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <User size={16} color="#6b7280" />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      <strong>{scenario.character_name}</strong> • {scenario.character_role}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ 
                    color: '#4b5563', 
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    marginBottom: '20px'
                  }}>
                    {scenario.description}
                  </p>

                  {/* Tags */}
                  {scenario.tags && scenario.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px',
                      marginBottom: '20px'
                    }}>
                      {scenario.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem'
                        }}>
                          {tag}
                        </span>
                      ))}
                      {scenario.tags.length > 3 && (
                        <span style={{
                          color: '#6b7280',
                          fontSize: '0.75rem'
                        }}>
                          +{scenario.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartSession(scenario)}
                    style={{
                      width: '100%',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5a67d8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                    }}
                  >
                    <Play size={18} />
                    Start Practice Session
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* No Scenarios Message */}
          {!state.scenariosLoading && state.filteredScenarios.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#1f2937' }}>
                No scenarios found
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Try adjusting your filters to find more training scenarios.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {state.activeTab === 'progress' && (
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
                {state.sessions.length}
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
                {state.sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}m
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
                {state.sessions.filter(s => s.overall_score >= 4).length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Excellent Sessions</div>
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
            
            {state.sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No practice sessions yet. Start practicing to see your progress!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {state.sessions.slice(0, 10).map((session) => (
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
                      backgroundColor: session.overall_score >= 4 ? '#10b981' : session.overall_score >= 3 ? '#f59e0b' : '#6b7280',
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

                    <button
                      onClick={() => handleDownloadReport(session.id)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#374151'
                      }}
                    >
                      📄 Report
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
