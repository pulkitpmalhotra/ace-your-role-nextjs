// app/admin/security/page.tsx (Admin only)
'use client';

import { useState, useEffect } from 'react';

export default function SecurityDashboard() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    active_users: 0,
    failed_logins: 0,
    data_exports: 0,
    account_deletions: 0
  });

  useEffect(() => {
    loadSecurityMetrics();
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/admin/security-metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setAuditLogs(data.recent_logs);
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">🔒 Security Dashboard</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
          <p className="text-3xl font-bold text-blue-600">{metrics.active_users}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Failed Logins (24h)</h3>
          <p className="text-3xl font-bold text-red-600">{metrics.failed_logins}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Data Exports (7d)</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.data_exports}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Account Deletions (7d)</h3>
          <p className="text-3xl font-bold text-purple-600">{metrics.account_deletions}</p>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Security Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Timestamp</th>
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Resource</th>
                <th className="text-left py-2">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2">{log.user_email}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                      log.action === 'DATA_EXPORT' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'ACCOUNT_DELETION' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2">{log.resource}</td>
                  <td className="py-2 font-mono text-sm">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
