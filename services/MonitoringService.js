// /services/MonitoringService.js
class MonitoringService {
  constructor() {
    this.metrics = {
      apiCalls: new Map(),
      errors: [],
      performance: new Map()
    };
  }
  
  // Wrap fetch for automatic monitoring
  monitoredFetch = async (url, options = {}) => {
    const start = performance.now();
    const apiCall = {
      url: url.toString(),
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    };
    
    try {
      const response = await originalFetch(url, options);
      const duration = performance.now() - start;
      
      this.trackPerformance('api-call', duration, {
        url: apiCall.url,
        status: response.status,
        method: apiCall.method
      });
      
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackError(error, {
        url: apiCall.url,
        duration,
        type: 'api-call'
      });
      
      throw error;
    }
  };
  
  trackPerformance(metric, value, metadata = {}) {
    const key = `${metric}:${JSON.stringify(metadata)}`;
    
    if (!this.metrics.performance.has(key)) {
      this.metrics.performance.set(key, []);
    }
    
    this.metrics.performance.get(key).push({
      value,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Send to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value),
        event_category: 'Performance',
        event_label: metadata.url || 'unknown'
      });
    }
  }
  
  trackError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.metrics.errors.push(errorData);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Monitored Error:', errorData);
    }
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorData);
    }
  }
  
  trackUserBehavior(event, properties = {}) {
    if (window.gtag) {
      window.gtag('event', event, {
        event_category: 'User Behavior',
        ...properties
      });
    }
  }
  
  startPerformanceMonitoring() {
    // Monitor page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        this.trackPerformance('page-load', perfData.loadEventEnd - perfData.fetchStart, {
          url: window.location.pathname,
          type: 'initial-load'
        });
      });
      
      // Monitor route changes in Next.js
      if (window.next?.router) {
        const router = window.next.router;
        
        router.events.on('routeChangeStart', (url) => {
          this.routeChangeStart = performance.now();
        });
        
        router.events.on('routeChangeComplete', (url) => {
          if (this.routeChangeStart) {
            const duration = performance.now() - this.routeChangeStart;
            this.trackPerformance('route-change', duration, { url });
          }
        });
      }
    }
  }
  
  async sendToErrorTracking(errorData) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (error) {
      console.error('Failed to send error to tracking:', error);
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Replace global fetch with monitored version
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = monitoring.monitoredFetch;
}
