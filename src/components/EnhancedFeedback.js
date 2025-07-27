import React, { useState, useEffect } from 'react';
import { CheckCircle, Star, Target, Lightbulb } from 'lucide-react';

function EnhancedFeedback({ sessionId, basicFeedback, onContinue, onViewDashboard }) {
  const [detailedFeedback, setDetailedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading detailed feedback
    setTimeout(() => {
      // For now, we'll create mock detailed feedback
      // In a real implementation, this would fetch from your API
      const mockDetailedFeedback = {
        overallScore: 3.8,
        categories: {
          opening: {
            score: 4,
            feedback: "Good professional greeting and introduction. You established rapport effectively.",
            suggestions: ["Try to set a clearer agenda", "Show more enthusiasm in your voice"]
          },
          discovery: {
            score: 3,
            feedback: "Asked some good questions but could have dug deeper into pain points.",
            suggestions: ["Use more open-ended questions", "Listen more actively to responses"]
          },
          presentation: {
            score: 4,
            feedback: "Well-tailored solution presentation with good benefit focus.",
            suggestions: ["Use more specific examples", "Address concerns proactively"]
          },
          objection: {
            score: 3,
            feedback: "Handled objections adequately but could show more confidence.",
            suggestions: ["Acknowledge concerns first", "Ask questions to understand better"]
          },
          closing: {
            score: 4,
            feedback: "Clear next steps and good attempt at commitment.",
            suggestions: ["Try trial closes earlier", "Be more direct in asking for the sale"]
          }
        },
        overall: {
          strengths: ["Professional demeanor", "Good product knowledge", "Clear communication"],
          improvements: ["Active listening", "Objection handling confidence", "Discovery depth"],
          nextFocus: "Focus on asking better discovery questions and handling objections with more confidence."
        }
      };
      setDetailedFeedback(mockDetailedFeedback);
      setLoading(false);
    }, 2000);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 4.5) return '#22c55e';
    if (score >= 3.5) return '#f59e0b';
    if (score >= 2.5) return '#f97316';
    return '#ef4444';
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
          </div>
        </div>

        {/* Detailed Feedback */}
        {detailedFeedback && (
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
              gap: '10px'
            }}
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
              gap: '10px'
            }}
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
