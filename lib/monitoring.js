class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.errors = [];
    this.performance = new Map();
  }

  // Real-time performance monitoring
  trackPerformance(operation, duration, metadata = {}) {
    const metric = {
      operation,
      duration,
      timestamp: Date.now(),
      url: metadata.url || window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    };

    this.performance.set(Date.now(), metric);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('performance', metric);
    }
  }

  // Error tracking and reporting
  trackError(error, context = {}) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    this.errors.push(errorReport);
    
    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    // Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('error', errorReport);
    }
  }

  // User behavior analytics
  trackUserBehavior(action, data = {}) {
    const event = {
      action,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      ...data
    };

    // Send to analytics
    this.sendToAnalytics('user-behavior', event);
  }

  // API performance monitoring
  async monitorAPICall(apiCall) {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      this.trackPerformance('api-call', duration, {
        status: 'success',
        method: apiCall.method || 'GET',
        type: 'api-call'
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.trackError(error, {
        type: 'api-call',
        duration,
        method: apiCall.method || 'GET'
      });
      
      throw error;
    }
  }

  // Send metrics to analytics service
  sendToAnalytics(type, data) {
    // Implement your analytics service here (Google Analytics, Mixpanel, etc.)
    console.log(`📊 Analytics: ${type}`, data);
    
    // Example: Send to custom analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: Date.now() })
    }).catch(err => console.warn('Analytics failed:', err));
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'anonymous';
  }

  getUserId() {
    return sessionStorage.getItem('userEmail') || 'anonymous';
  }
}

export const monitoring = new MonitoringService();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  monitoring.startPerformanceMonitoring();
}
