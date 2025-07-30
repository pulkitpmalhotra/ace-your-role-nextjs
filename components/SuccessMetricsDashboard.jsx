// /components/SuccessMetricsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'recharts';

function SuccessMetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  
  const targetMetrics = {
    monthlyCosts: {
      current: 115,
      target: 88.20,
      validation: 'Monthly billing reports'
    },
    aiResponseTime: {
      current: 2.3,
      target: 1.5,
      validation: 'Performance monitoring'
    },
    pageLoadTime: {
      current: 3.4,
      target: 2.0,
      validation: 'Lighthouse scores'
    },
    speechAccuracy: {
      current: 88,
      target: 97,
      validation: 'User feedback & testing'
    },
    userSatisfaction: {
      current: 4.2,
      target: 4.6,
      validation: 'Post-session surveys'
    },
    loginConversion: {
      current: 0,
      target: 40,
      validation: 'Analytics tracking'
    },
    sessionCompletion: {
      current: 78,
      target: 90,
      validation: 'Usage analytics'
    },
    gdprCompliance: {
      current: 80,
      target: 100,
      validation: 'Legal audit'
    }
  };
  
  // ROI Calculation
  const roi = {
    investment: 8000, // Development cost
    monthlySavings: 26.80, // Starting immediately
    paybackPeriod: 10.5, // months
    threeYearNPV: 1651
  };
  
  return (
    <div className="success-metrics-dashboard">
      <h2>Implementation Success Metrics</h2>
      
      <div className="metrics-grid">
        {Object.entries(targetMetrics).map(([key, metric]) => (
          <MetricCard
            key={key}
            name={key}
            current={metric.current}
            target={metric.target}
            validation={metric.validation}
          />
        ))}
      </div>
      
      <div className="roi-section">
        <h3>Return on Investment</h3>
        <div className="roi-metrics">
          <div className="roi-card">
            <span className="label">Investment</span>
            <span className="value">${roi.investment}</span>
          </div>
          <div className="roi-card">
            <span className="label">Monthly Savings</span>
            <span className="value">${roi.monthlySavings}</span>
          </div>
          <div className="roi-card">
            <span className="label">Payback Period</span>
            <span className="value">{roi.paybackPeriod} months</span>
          </div>
          <div className="roi-card">
            <span className="label">3-Year NPV</span>
            <span className="value">${roi.threeYearNPV}</span>
          </div>
        </div>
      </div>
      
      <RiskMitigationPlan />
    </div>
  );
}

function MetricCard({ name, current, target, validation }) {
  const progress = (current / target) * 100;
  const isImprovement = target < current ? 
    ((current - target) / current * 100) : 
    ((target - current) / target * 100);
  
  return (
    <div className="metric-card">
      <h4>{name.replace(/([A-Z])/g, ' $1').trim()}</h4>
      <div className="metric-values">
        <span className="current">Current: {current}</span>
        <span className="target">Target: {target}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="improvement">
        {target < current ? '↓' : '↑'} {isImprovement.toFixed(1)}% improvement needed
      </p>
      <p className="validation-method">{validation}</p>
    </div>
  );
}

function RiskMitigationPlan() {
  const risks = [
    {
      risk: 'Staged Rollout',
      mitigation: 'Deploy improvements incrementally',
      status: 'active'
    },
    {
      risk: 'Feature Flags',
      mitigation: 'Enable/disable features without code changes',
      status: 'planned'
    },
    {
      risk: 'Monitoring',
      mitigation: 'Real-time alerts for performance degradation',
      status: 'active'
    },
    {
      risk: 'Rollback Plan',
      mitigation: 'Automated rollback if issues detected',
      status: 'ready'
    },
    {
      risk: 'User Communication',
      mitigation: 'Inform users of improvements and changes',
      status: 'planned'
    }
  ];
  
  return (
    <div className="risk-mitigation">
      <h3>Risk Mitigation Plan</h3>
      <ul>
        {risks.map((item, index) => (
          <li key={index} className={`risk-item ${item.status}`}>
            <strong>{item.risk}:</strong> {item.mitigation}
            <span className="status">{item.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
