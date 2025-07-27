import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { TrendingUp, ArrowLeft, BarChart3, Calendar } from 'lucide-react';

function FeedbackDashboard({ userEmail, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserSessions();
  }, []);

  const loadUserSessions = async () => {
    try {
      setLoading(true);
      // For now, let's use the regular sessions API
      const data = await apiService.getUserSessions(userEmail);
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

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
            <p>No practice sessions yet. Start practicing to see your progress!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
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
                  ✓
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackDashboard;
