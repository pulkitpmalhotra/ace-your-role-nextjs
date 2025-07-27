import React from 'react';
import { CheckCircle, Star } from 'lucide-react';

function EnhancedFeedback({ sessionId, basicFeedback, onContinue, onViewDashboard }) {
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
          
          <div style={{ 
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '25px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            display: 'inline-block',
            marginBottom: '20px'
          }}>
            Enhanced Feedback Coming Soon!
          </div>

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
