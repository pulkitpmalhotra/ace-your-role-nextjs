// src/components/EnhancedFeedback.js
import React, { useState } from 'react';
import { CheckCircle, Star, TrendingUp, Target, Lightbulb, ArrowRight } from 'lucide-react';

function EnhancedFeedback({ sessionId, basicFeedback, onContinue, onViewDashboard }) {
  const [detailedFeedback, setDetailedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load detailed feedback on component mount
  React.useEffect(() => {
    loadDetailedFeedback();
  }, []);

  const loadDetailedFeedback = async () => {
    try {
      setLoading(true);
      
      // Try to get stored detailed feedback first
      const response = await fetch(`/api/sessions/${sessionId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDetailedFeedback(data.data);
        }
      }
    } catch (err) {
      console.error('Error loading detailed feedback:', err);
      setError('Could not load detailed feedback');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return '#22c55e'; // Green
    if (score >= 3.5) return '#f59e0b'; // Yellow
    if (score >= 2.5) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Needs Work';
    return 'Focus Area';
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f9ff',
        padding: '20px'
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
          <p>Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            Session Complete!
          </h1>
          
          {detailedFeedback && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: getScoreColor(detailedFeedback.overallScore),
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                {detailedFeedback.overallScore}/5.0 • {getScoreLabel(detailedFeedback.overallScore)}
              </div>
            </div>
          )}

          {/* Basic Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '20px',
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {basicFeedback.exchanges}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Exchanges</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {basicFeedback.duration}m
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Duration</div>
            </div>
            {detailedFeedback && (
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Object.values(detailedFeedback.categories).reduce((acc, cat) => acc + (cat.score >= 4 ? 1 : 0), 0)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Strong Areas</div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Feedback */}
        {detailedFeedback ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            
            {/* Skills Breakdown */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={24} />
                Skills Assessment
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {Object.entries(detailedFeedback.categories).map(([category, data]) => (
                  <div key={category} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        margin: 0
                      }}>
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <div style={{
                        backgroundColor: getScoreColor(data.score),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        {data.score}/5
                      </div>
                    </div>
                    
                    <p style={{ 
                      color: '#4b5563', 
                      marginBottom: '15px',
                      lineHeight: '1.5'
                    }}>
                      {data.feedback}
                    </p>
                    
                    {data.suggestions && data.suggestions.length > 0 && (
                      <div style={{
                        backgroundColor: '#f0f9ff',
                        padding: '15px',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px',
                          color: '#1e40af'
                        }}>
                          💡 Improvement Tips:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {data.suggestions.map((suggestion, index) => (
                            <li key={index} style={{ color: '#1e40af', marginBottom: '4px' }}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Insights */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lightbulb size={24} />
                Key Insights
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                
                {/* Strengths */}
                {detailedFeedback.overall.strengths.length > 0 && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h3 style={{ color: '#16a34a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✅ Your Strengths
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {detailedFeedback.overall.strengths.map((strength, index) => (
                        <li key={index} style={{ color: '#166534', marginBottom: '8px' }}>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {detailedFeedback.overall.improvements.length > 0 && (
                  <div style={{
                    backgroundColor: '#fff7ed',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa'
                  }}>
                    <h3 style={{ color: '#ea580c', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🎯 Focus Areas
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {detailedFeedback.overall.improvements.map((improvement, index) => (
                        <li key={index} style={{ color: '#c2410c', marginBottom: '8px' }}>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Session Focus */}
              {detailedFeedback.overall.nextFocus && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '12px',
                  marginTop: '20px',
                  border: '1px solid #bfdbfe'
                }}>
                  <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>
                    🚀 Next Session Focus
                  </h3>
                  <p style={{ color: '#1e3a8a', margin: 0 }}>
                    {detailedFeedback.overall.nextFocus}
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Fallback to basic feedback if detailed analysis fails */
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
              {basicFeedback.performance}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Detailed analysis is being processed. You can view it later in your dashboard.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginTop: '30px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onContinue}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            <CheckCircle size={20} />
            Practice Another Scenario
          </button>
          
          <button
            onClick={onViewDashboard}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#
