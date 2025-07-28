import React from 'react';

function PrivacyNotice({ onAccept, onDecline }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Privacy Notice</h3>
      <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#6b7280' }}>
        We collect session data and download logs to improve our service. 
        Your data is secure and never shared with third parties.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onAccept}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}

export default PrivacyNotice;
