// /components/MonitoringDashboard.jsx
function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    aiCostReduction: 0,
    userFeedbackScore: 0,
    pageLoadTime: 0,
    loginConversionRate: 0
  });
  
  const successIndicators = {
    shortTerm: [
      { metric: '43% reduction in AI processing costs', current: metrics.aiCostReduction },
      { metric: 'Improved user feedback scores', current: metrics.userFeedbackScore },
      { metric: 'Faster page load times', current: metrics.pageLoadTime },
      { metric: 'Higher login conversion rates', current: metrics.loginConversionRate }
    ],
    longTerm: [
      'Professional-grade platform with enterprise features',
      'Complete GDPR compliance for European market',
      'Scalable architecture for 10x user growth',
      'Competitive advantage in AI training market'
    ]
  };
  
  useEffect(() => {
    // Fetch real metrics
    fetchMetrics();
    
    // Set up real-time monitoring
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  async function fetchMetrics() {
    try {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }
  
  return (
    <div className="monitoring-dashboard">
      <h2>30-Day Success Indicators</h2>
      
      <div className="metrics-section">
        <h3>Short-term Metrics</h3>
        <div className="metrics-grid">
          {successIndicators.shortTerm.map((indicator, index) => (
            <div key={index} className="metric-card">
              <h4>{indicator.metric}</h4>
              <div className="metric-value">{indicator.current}%</div>
              <div className="metric-trend">
                {indicator.current > 0 ? '📈' : '📉'} Trending
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="long-term-section">
        <h3>90-Day Benefits</h3>
        <ul className="benefits-list">
          {successIndicators.longTerm.map((benefit, index) => (
            <li key={index} className="benefit-item">
              ✅ {benefit}
            </li>
          ))}
        </ul>
      </div>
      
      <AlertsSection />
    </div>
  );
}

function AlertsSection() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    // Set up WebSocket for real-time alerts
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      setAlerts(prev => [...prev, alert].slice(-5)); // Keep last 5 alerts
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="alerts-section">
      <h3>Real-time Alerts</h3>
      {alerts.length === 0 ? (
        <p className="no-alerts">✅ All systems operational</p>
      ) : (
        <ul className="alerts-list">
          {alerts.map((alert, index) => (
            <li key={index} className={`alert-item ${alert.severity}`}>
              <span className="timestamp">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              <span className="message">{alert.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
