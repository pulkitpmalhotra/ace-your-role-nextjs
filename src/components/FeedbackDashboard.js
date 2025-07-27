// src/components/FeedbackDashboard.js
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { TrendingUp, Award, Target, Calendar, ArrowLeft, BarChart3 } from 'lucide-react';

function FeedbackDashboard({ userEmail, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadUserSessions();
  }, []);

  const loadUserSessions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserSessionsWithFeedback(userEmail);
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (sessions.length === 0) return null;

    const sessionsWithScores = sessions.filter(s => s.overall_score);
    if (sessionsWithScores.length === 0) return null;

    const categories = ['opening', 'discovery', 'presentation', 'objectionHandling', 'closing'];
    const progress = {};

    categories.forEach(category => {
      const categoryScores = sessionsWithScores
        .map(session => {
          try {
            const feedback = JSON.parse(session.detailed_feedback || '{}');
            return feedback.categories?.[category]?.score || null;
          } catch {
            return null;
          }
        })
        .filter(score => score !== null);

      if (categoryScores.length > 0) {
        progress[category] = {
          current: categoryScores[categoryScores.length - 1],
          average: categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length,
          trend: categoryScores.length > 1 ? 
            categoryScores[categoryScores.length - 1] - categoryScores[0] : 0,
          sessions: categoryScores.length
        };
      }
    });

    return progress;
  };

  const getOverallStats = () => {
    const sessionsWithScores = sessions.filter(s => s.overall_score);
    if (sessionsWithScores.length === 0) return null;

    const scores = sessionsWithScores.map(s => s.overall_score);
    const totalTime = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    return {
      totalSessions: sessions.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      totalTime: totalTime,
      recentScore: scores[scores.length - 1],
      improvement: scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
    };
  };

  const formatCategoryName = (category) => {
    const names = {
      opening: 'Opening & Rapport',
      discovery: 'Discovery & Needs',
      presentation: 'Solution Presentation',
      objectionHandling: 'Objection Handling',
      closing: 'Closing & Next Steps'
    };
    return names[category] || category;
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return '#22c55e';
    if (score >= 3.5) return '#f59e0b';
    if (score >= 2.5) return '#f97316';
    return '#ef4444';
  };

  const progress = calculateProgress();
  const stats = getOverallStats();

  if (loading) {
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
          <p>Loading your progress...</p>
        </div>
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
          onClick={loadUserSessions}
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
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <BarChart3 size={40} />
          Your Progress Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Track your sales skills improvement over time
        </p>
      </div>

      {/* Overall Stats */}
      {stats && (
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
              {stats.totalSessions}
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
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(stats.averageScore) }}>
              {stats.averageScore.toFixed(1)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Average Score</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {stats.bestScore.toFixed(1)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Best Score</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.totalTime}m
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Practice Time</div>
          </div>
        </div>
      )}

      {/* Skills Progress */}
      {progress && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={24} />
            Skills Progress
          </h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {Object.entries(progress).map(([category, data]) => (
              <div key={category} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                    {formatCategoryName(category)}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {data.sessions} sessions
                    </span>
                    <div style={{
                      backgroundColor: getScoreColor(data.current),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {data.current.toFixed(1)}/5.0
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    backgroundColor: getScoreColor(data.current),
                    height: '100%',
                    width: `${(data.current / 5) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280' }}>
                  <span>Average: {data.average.toFixed(1)}</span>
                  <span style={{ color: data.trend > 0 ? '#22c55e' : data.trend < 0 ? '#ef4444' : '#6b7280' }}>
                    {data.trend > 0 ? '↗' : data.trend < 0 ? '↘' : '→'} 
                    {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)} trend
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <p>No practice sessions yet. Start practicing to see your progress!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.slice(0, 10).map((session) => {
              let detailedFeedback = null;
              try {
                detailedFeedback = session.detailed_feedback ? JSON.parse(session.detailed_feedback) : null;
              } catch (e) {
                console.error('Error parsing detailed feedback:', e);
              }

              return (
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
                    backgroundColor: session.overall_score ? getScoreColor(session.overall_score) : '#9ca3af',
                    color: 'white',
                    width: '50px',
                    height: '50px',
                    borderRadius: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {session.overall_score ? session.overall_score.toFixed(1) : 'N/A'}
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
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        textTransform: 'capitalize'
                      }}>
                        {session.scenarios.difficulty}
                      </span>
                    )}
                  </div>
                  
                  {detailedFeedback && (
                    <button
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Here you could open a detailed view modal
                        console.log('View detailed feedback for session:', session.id);
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Achievements Section */}
      {stats && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          marginTop: '30px'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} />
            Achievements
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            
            {/* First Session */}
            {stats.totalSessions >= 1 && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '2px solid #bfdbfe',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎯</div>
                <h3 style={{ color: '#1e40af', marginBottom: '5px' }}>First Steps</h3>
                <p style={{ color: '#3730a3', fontSize: '0.9rem', margin: 0 }}>
                  Completed your first practice session
                </p>
              </div>
            )}
            
            {/* Consistent Practitioner */}
            {stats.totalSessions >= 5 && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '2px solid #bbf7d0',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔥</div>
                <h3 style={{ color: '#16a34a', marginBottom: '5px' }}>Consistent Practitioner</h3>
                <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0 }}>
                  Completed 5+ practice sessions
                </p>
              </div>
            )}
            
            {/* High Performer */}
            {stats.bestScore >= 4.5 && (
              <div style={{
                backgroundColor: '#fefce8',
                border: '2px solid #fde047',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⭐</div>
                <h3 style={{ color: '#ca8a04', marginBottom: '5px' }}>High Performer</h3>
                <p style={{ color: '#a16207', fontSize: '0.9rem', margin: 0 }}>
                  Achieved a score of 4.5 or higher
                </p>
              </div>
            )}
            
            {/* Improvement Master */}
            {stats.improvement >= 1.0 && (
              <div style={{
                backgroundColor: '#fdf2f8',
                border: '2px solid #fbcfe8',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📈</div>
                <h3 style={{ color: '#be185d', marginBottom: '5px' }}>Improvement Master</h3>
                <p style={{ color: '#9d174d', fontSize: '0.9rem', margin: 0 }}>
                  Improved by 1+ points from first session
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackDashboard;
