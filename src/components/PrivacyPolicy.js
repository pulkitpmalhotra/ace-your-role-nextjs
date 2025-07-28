// src/components/PrivacyPolicy.js
import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Trash2, Download } from 'lucide-react';

function PrivacyPolicy({ onBack }) {
  const lastUpdated = "January 15, 2025";
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      padding: '20px 0'
    }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
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
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <Shield size={32} color="#10b981" />
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: 0,
                color: '#1f2937'
              }}>
                Privacy Policy
              </h1>
              <p style={{
                color: '#6b7280',
                margin: '4px 0 0 0',
                fontSize: '0.9rem'
              }}>
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <p style={{
              color: '#1e40af',
              margin: 0,
              fontSize: '0.95rem'
            }}>
              We are committed to protecting your privacy and being transparent about how we collect, use, and protect your information.
            </p>
          </div>
        </div>

        {/* Privacy Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          
          {/* Information We Collect */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Eye size={24} color="#667eea" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                Information We Collect
              </h2>
            </div>
            
            <div style={{ marginLeft: '34px' }}>
              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Account Information
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                <li>Email address (required for account creation)</li>
                <li>Optional profile information (name, company, role)</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Practice Session Data
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                <li>Conversation transcripts from roleplay sessions</li>
                <li>Performance scores and feedback</li>
                <li>Session duration and frequency</li>
                <li>Scenario preferences and selections</li>
              </ul>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Technical Information
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
                <li>Device and browser information</li>
                <li>IP address and general location</li>
                <li>Usage analytics and performance metrics</li>
                <li>Error logs for troubleshooting</li>
              </ul>
            </div>
          </section>

          {/* How We Use Information */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Lock size={24} color="#10b981" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                How We Use Your Information
              </h2>
            </div>
            
            <div style={{ marginLeft: '34px' }}>
              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Service Delivery
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                <li>Provide AI-powered roleplay training sessions</li>
                <li>Generate personalized feedback and coaching</li>
                <li>Track your progress and improvement over time</li>
                <li>Customize scenarios based on your preferences</li>
              </ul>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Platform Improvement
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                <li>Analyze usage patterns to improve our AI models</li>
                <li>Develop new training scenarios and features</li>
                <li>Fix bugs and enhance performance</li>
                <li>Conduct anonymized research on training effectiveness</li>
              </ul>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Communication
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
                <li>Send important account and service updates</li>
                <li>Provide customer support and assistance</li>
                <li>Share new features and improvements (opt-in only)</li>
              </ul>
            </div>
          </section>

          {/* Data Protection */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Shield size={24} color="#f59e0b" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                Data Protection & Security
              </h2>
            </div>
            
            <div style={{ marginLeft: '34px' }}>
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ color: '#92400e', margin: 0, fontWeight: '500' }}>
                  🔒 All conversation data is encrypted and stored securely using industry-standard practices.
                </p>
              </div>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Security Measures
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                <li>End-to-end encryption for all data transmission</li>
                <li>Secure cloud storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to data on a need-to-know basis</li>
              </ul>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '8px' }}>
                Data Retention
              </h3>
              <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
                <li><strong>Conversation Data:</strong> 90 days (automatically deleted)</li>
                <li><strong>Performance Analytics:</strong> 2 years for improvement insights</li>
                <li><strong>Account Information:</strong> Until account deletion</li>
                <li><strong>Audio Data:</strong> Never stored permanently (processed in real-time)</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Download size={24} color="#8b5cf6" />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: 0,
                color: '#1f2937'
              }}>
                Your Rights & Controls
              </h2>
            </div>
            
            <div style={{ marginLeft: '34px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h4 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>Access Your Data</h4>
                  <p style={{ color: '#1e3a8a', margin: 0, fontSize: '0.9rem' }}>
                    Request a copy of all your personal data
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h4 style={{ color: '#166534', margin: '0 0 8px 0' }}>Correct Information</h4>
                  <p style={{ color: '#15803d', margin: 0, fontSize: '0.9rem' }}>
                    Update or correct any inaccurate data
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h4 style={{ color: '#be185d', margin: '0 0 8px 0' }}>Delete Your Data</h4>
                  <p style={{ color: '#c2185b', margin: 0, fontSize: '0.9rem' }}>
                    Request deletion of your account and data
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h4 style={{ color: '#c2410c', margin: '0 0 8px 0' }}>Control Usage</h4>
                  <p style={{ color: '#ea580c', margin: 0, fontSize: '0.9rem' }}>
                    Opt out of data processing activities
                  </p>
                </div>
              </div>

              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@ai-roleplay.com" style={{ color: '#667eea', textDecoration: 'none' }}>
                  privacy@ai-roleplay.com
                </a>
              </p>
            </div>
          </section>

          {/* Third Party Services */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              Third-Party Services
            </h2>
            
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '12px' }}>
                AI Processing
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                We use Google's Gemini AI to analyze conversations and provide feedback. 
                Your data is processed according to Google's privacy policies and is not 
                used to train their models.
              </p>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '12px' }}>
                Data Storage
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
                We use Supabase for secure data storage. All data is encrypted at rest 
                and in transit, hosted in SOC 2 compliant data centers.
              </p>

              <h3 style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '12px' }}>
                Analytics
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                We use privacy-focused analytics to understand how our platform is used. 
                No personal information is shared with analytics providers.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              Contact Us
            </h2>
            
            <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '16px' }}>
              If you have any questions about this Privacy Policy or our data practices, 
              please don't hesitate to contact us:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ color: '#374151', margin: '0 0 8px 0' }}>Email</h4>
                <a 
                  href="mailto:privacy@ai-roleplay.com"
                  style={{ color: '#667eea', textDecoration: 'none' }}
                >
                  privacy@ai-roleplay.com
                </a>
              </div>

              <div>
                <h4 style={{ color: '#374151', margin: '0 0 8px 0' }}>Support</h4>
                <a 
                  href="mailto:support@ai-roleplay.com"
                  style={{ color: '#667eea', textDecoration: 'none' }}
                >
                  support@ai-roleplay.com
                </a>
              </div>

              <div>
                <h4 style={{ color: '#374151', margin: '0 0 8px 0' }}>Response Time</h4>
                <span style={{ color: '#6b7280' }}>Within 72 hours</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: '0.9rem',
            marginBottom: '16px'
          }}>
            This policy was last updated on {lastUpdated}. We will notify you of any 
            significant changes via email or through our platform.
          </p>
          
          <button
            onClick={onBack}
            className="btn btn-primary"
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
