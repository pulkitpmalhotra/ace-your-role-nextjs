// src/components/MobileNavigation.js
import React, { useState } from 'react';
import { Menu, X, Target, BarChart3, User, LogOut } from 'lucide-react';

function MobileNavigation({ 
  activeTab, 
  onTabChange, 
  userEmail, 
  onLogout,
  className = ''
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    {
      id: 'scenarios',
      label: 'Practice',
      icon: Target,
      description: 'Start training sessions'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: BarChart3,
      description: 'View your improvement'
    }
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className={`mobile-nav-header ${className}`} style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Logo/Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AI Roleplay
            </h1>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0
            }}>
              Sales Training
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isMenuOpen ? 0 : '-300px',
          width: '300px',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 101,
          transition: 'right 0.3s ease',
          boxShadow: isMenuOpen ? '-4px 0 6px rgba(0, 0, 0, 0.1)' : 'none',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Menu Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <User size={16} />
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Signed in as
            </span>
          </div>
          <p style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            {userEmail}
          </p>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: 1,
          padding: '20px 0'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: 'none',
                  backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                  borderLeft: isActive ? '4px solid #667eea' : '4px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon 
                  size={20} 
                  color={isActive ? '#667eea' : '#6b7280'} 
                />
                <div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: isActive ? '#667eea' : '#374151',
                    marginBottom: '2px'
                  }}>
                    {tab.label}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Menu Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onLogout();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Bottom Tab Bar (Alternative Navigation) */}
      <div
        className="mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          zIndex: 50
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon 
                size={20} 
                color={isActive ? '#667eea' : '#6b7280'} 
              />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: isActive ? '#667eea' : '#6b7280'
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default MobileNavigation;
