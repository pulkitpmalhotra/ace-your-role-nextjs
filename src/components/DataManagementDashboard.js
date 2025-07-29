import React, { useState, useEffect } from 'react';
import { Download, Trash2, Shield, Eye, Lock, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

function DataManagementDashboard({ userEmail }) {
  const [dataOverview, setDataOverview] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const [deletionStatus, setDeletionStatus] = useState('idle');

  const dataCategories = {
    profile: {
      name: 'Account Profile',
      description: 'Your account information, preferences, and settings',
      icon: '👤',
      records: dataOverview?.profile?.recordCount || 1,
      size: dataOverview?.profile?.dataSize || '0 KB',
      retention: 'Until account deletion'
    },
    conversations: {
      name: 'Practice Sessions',
      description: 'Voice conversations, transcripts, and session data',
      icon: '💬',
      records: dataOverview?.conversations?.recordCount || 0,
      size: dataOverview?.conversations?.dataSize || '0 KB',
      retention: '90 days (auto-delete)'
    },
    analytics: {
      name: 'Performance Data',
      description: 'Skill assessments, progress tracking, and feedback',
      icon: '📊',
      records: dataOverview?.analytics?.recordCount || 0,
      size: dataOverview?.analytics?.dataSize || '0 KB',
      retention: '2 years'
    },
    technical: {
      name: 'Technical Logs',
      description: 'Error logs, performance data, and system information',
      icon: '🔧',
      records: dataOverview?.technical?.recordCount || 0,
      size: dataOverview?.technical?.dataSize || '0 KB',
      retention: '30 days'
    }
  };

  return (
    <div className="data-management-dashboard">
      <header style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <Shield size={32} color="#10b981" />
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              Your Data & Privacy Controls
            </h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              Complete control over your personal information
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ color: '#1e40af', margin: 0, fontSize: '0.95rem' }}>
            <strong>GDPR Compliant:</strong> You have complete control over your data. 
            Export, modify, or delete your information at any time.
          </p>
        </div>
      </header>

      {/* Data Categories */}
      <div style={{
        display: 'grid',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {Object.entries(dataCategories).map(([key, category]) => (
          <DataCategoryCard
            key={key}
            category={key}
            data={category}
            onExport={() => handleExportCategory(key)}
            onDelete={() => handleDeleteCategory(key)}
            onView={() => handleViewCategory(key)}
          />
        ))}
      </div>

      {/* Account Deletion */}
      <DangerZone
        userEmail={userEmail}
        onDeleteAccount={handleDeleteAccount}
        deletionStatus={deletionStatus}
      />
    </div>
  );
}

function DataCategoryCard({ category, data, onExport, onDelete, onView }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem' }}>{data.icon}</div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              {data.name}
            </h3>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              {data.description}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={onView}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="View Data"
          >
            <Eye size={16} />
          </button>
          
          <button
            onClick={onExport}
            style={{
              padding: '8px',
              backgroundColor: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#1e40af'
            }}
            title="Export Data"
          >
            <Download size={16} />
          </button>
          
          <button
            onClick={onDelete}
            style={{
              padding: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#dc2626'
            }}
            title="Delete Data"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
            {data.records}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Records</div>
        </div>
        
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
            {data.size}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Storage Size</div>
        </div>
        
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
            {data.retention}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Retention</div>
        </div>
      </div>
    </div>
  );
}

function DangerZone({ userEmail, onDeleteAccount, deletionStatus }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #fecaca',
      borderRadius: '12px',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <AlertTriangle size={24} color="#dc2626" />
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#dc2626',
          margin: 0
        }}>
          Danger Zone
        </h2>
      </div>

      <p style={{
        color: '#6b7280',
        marginBottom: '20px',
        lineHeight: '1.6'
      }}>
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirmation ? (
        <button
          onClick={() => setShowConfirmation(true)}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Delete My Account
        </button>
      ) : (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '1.1rem'
          }}>
            Confirm Account Deletion
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Type your email to confirm: {userEmail}
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Reason for deletion (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onDeleteAccount(confirmEmail, reason)}
              disabled={confirmEmail !== userEmail || deletionStatus === 'deleting'}
              style={{
                backgroundColor: confirmEmail === userEmail ? '#dc2626' : '#9ca3af',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: confirmEmail === userEmail ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              {deletionStatus === 'deleting' ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
            
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmEmail('');
                setReason('');
              }}
              style={{
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataManagementDashboard;
