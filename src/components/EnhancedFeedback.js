import React, { useState, useEffect } from 'react';
import { CheckCircle, Star, Target, Lightbulb } from 'lucide-react';

function EnhancedFeedback({ sessionId, basicFeedback, onContinue, onViewDashboard }) {
  const [detailedFeedback, setDetailedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDetailedFeedback();
  }, [sessionId]);

  const loadDetailedFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔬 Loading detailed feedback for session:', sessionId);
      
      // Wait a bit for the feedback analysis to complete
      let attempts = 0;
      const maxAttempts = 10; // Try for about 10 seconds
      
      while (attempts < maxAttempts) {
        try {
          // Try to get the session with detailed feedback
          const response = await fetch(`/api/sessions?userEmail=${encodeURIComponent(basicFeedback.userEmail || 'unknown')}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const session = result.data.find(s => s.id === sessionId);
              
              if (session && session.detailed_feedback) {
                console.log('✅ Found detailed feedback in database');
                const parsedFeedback = JSON.parse(session.detailed_feedback);
                setDetailedFeedback(parsedFeedback);
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Attempt', attempts + 1, 'failed, retrying...');
        }
        
        attempts++;
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // If we get here, we couldn't find detailed feedback - use the basic feedback as fallback
      console.log('⚠️ Could not load detailed feedback after', maxAttempts, 'attempts');
      setDetailedFeedback(createBasicDetailedFeedback());
      
    } catch (err) {
      console.error('❌ Error loading detailed feedback:', err);
      setDetailedFeedback(createBasicDetailedFeedback());
    } finally {
      setLoading(false);
    }
  };

  const createBasicDetailedFeedback = () => {
    // Create a basic structure that matches the real feedback format
    // but indicates that detailed analysis is pending
    return {
      overallScore: 0, // Will be updated when real feedback arrives
      categories: {
        opening: {
          score: 0,
          feedback: "Detailed analysis in progress...",
          suggestions: ["Complete analysis will be available shortly"]
        },
        discovery: {
          score: 0,
          feedback: "Detailed analysis in progress...",
          suggestions: ["Complete analysis will be available shortly"]
        },
        presentation: {
          score: 0,
          feedback: "Detailed analysis in progress...",
          suggestions: ["Complete analysis will be available shortly"]
        },
        objection: {
          score: 0,
          feedback: "Detailed analysis in progress...",
          suggestions: ["Complete analysis will be available shortly"]
        },
        closing: {
          score: 0,
          feedback: "Detailed analysis in progress...",
          suggestions: ["Complete analysis will be available shortly"]
        }
      },
      overall: {
        strengths: ["Session completed successfully"],
        improvements: ["Detailed analysis will provide specific recommendations"],
        nextFocus: "Complete analysis will be available in your progress dashboard shortly."
      }
    };
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return '#22c55e'; // Green
    if (score >= 3.5) return '#f59e0b'; // Yellow
    if (score >= 2.5) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score === 0) return 'Analyzing...';
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Needs Work';
    return 'Focus Area';
  };

  const formatCategoryName = (category) => {
    const names = {
      opening: 'Opening & Rapport',
      discovery: 'Discovery & Needs',
      presentation: 'Solution Presentation',
      objection: 'Objection Handling',
      closing: 'Closing & Next Steps'
    };
    return names[category] || category;
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
          <p style={{ color: '#1e40af', fontSize: '1.1rem' }}>Analyzing your sales performance...</p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>This may take a few seconds</p>
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
          
          {detailedFeedback && detailedFeedback.overallScore > 0 && (
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

          {/* Analysis Status */}
          {detailedFeedback && detailedFeedback.overallScore === 0 && (
            <div style={{ 
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '12px 20px',
              borderRadius: '25px',
              fontWeight: 'bold',
              fontSize: '1rem',
              marginBottom: '20px',
              display: 'inline-block'
            }}>
              🔬 Detailed Analysis In Progress...
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
            {detailedFeedback && detailedFeedback.overallScore > 0 && (
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Object.values(detailedFeedback.categories).reduce((acc, cat) => acc + (cat.score >= 4 ? 1 : 0), 0)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Strong Areas</div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Feedback or Analysis Notice */}
        {detailedFeedback && detailedFeedback.overallScore > 0 ? (
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
                        margin: 0
                      }}>
                        {formatCategoryName(category)}
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
          /* Analysis in Progress Notice */
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔬</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1f2937' }}>
              Detailed Analysis In Progress
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '1.1rem' }}>
              Our AI is analyzing your conversation to provide detailed feedback on your sales skills.
            </p>
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ color: '#1e40af', margin: 0 }}>
                📊 Complete analysis with scores and specific recommendations will be available in your <strong>Progress Dashboard</strong> shortly.
              </p>
            </div>
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
            onClick={() => {
              sessionStorage.setItem('dashboardTab', 'progress');
              onViewDashboard();
            }}
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
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            <Star size={20} />
            View Progress Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedFeedback;
