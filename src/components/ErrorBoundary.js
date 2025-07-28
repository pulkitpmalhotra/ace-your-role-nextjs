// src/components/ErrorBoundary.js - Fixed syntax errors
import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (process.env.NODE_ENV === 'production') {
      // Log to error reporting service in production
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fee2e2'
          }}>
            {/* Error Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={48} color="#dc2626" />
              </div>
            </div>

            {/* Error Message */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '16px'
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              We're sorry, but something unexpected happened. Our team has been notified 
              and we're working to fix the issue.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a67d8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RefreshCw size={18} />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RefreshCw size={18} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Home size={18} />
                Go Home
              </button>
            </div>

            {/* Technical Details Toggle */}
            {(isDevelopment || this.state.error) && (
              <div>
                <button
                  onClick={this.toggleDetails}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    margin: '0 auto',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Bug size={16} />
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </button>

                {this.state.showDetails && (
                  <div style={{
                    marginTop: '20px',
                    textAlign: 'left',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '12px'
                    }}>
                      Error Details:
                    </h3>
                    
                    {this.state.error && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#dc2626',
                          marginBottom: '4px'
                        }}>
                          Error Message:
                        </h4>
                        <pre style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          padding: '8px',
                          borderRadius: '4px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          margin: 0
                        }}>
                          {this.state.error.toString()}
                        </pre>
                      </div>
                    )}

                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#dc2626',
                          marginBottom: '4px'
                        }}>
                          Component Stack:
                        </h4>
                        <pre style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          padding: '8px',
                          borderRadius: '4px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          margin: 0
                        }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Support Information */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '8px'
              }}>
                Need Help?
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#1e3a8a',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                If this problem persists, please contact our support team with the error details above.
              </p>
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <a
                  href="mailto:support@ai-roleplay.com"
                  style={{
                    color: '#1e40af',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  📧 Email Support
                </a>
                <a
                  href="https://github.com/your-repo/issues"
                  style={{
                    color: '#1e40af',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🐛 Report Bug
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional Error Fallback Component
export function ErrorFallback({ error, resetError }) {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#fee2e2',
      borderRadius: '12px',
      margin: '20px',
      border: '1px solid #fecaca'
    }}>
      <div style={{
        fontSize: '3rem',
        marginBottom: '16px'
      }}>
        😵
      </div>
      
      <h2 style={{
        color: '#dc2626',
        marginBottom: '16px',
        fontSize: '1.5rem'
      }}>
        Something went wrong
      </h2>
      
      <p style={{
        color: '#b91c1c',
        marginBottom: '20px',
        fontSize: '1rem'
      }}>
        An unexpected error occurred. Please try refreshing the page.
      </p>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {resetError && (
          <button
            onClick={resetError}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Reload Page
        </button>
      </div>

      {/* Show error details in development */}
      {process.env.NODE_ENV === 'development' && error && (
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary style={{
            cursor: 'pointer',
            color: '#dc2626',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Error Details (Development Only)
          </summary>
          <pre style={{
            backgroundColor: '#f3f4f6',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  );
}

export default ErrorBoundary;
