// app/privacy-center/page.tsx
'use client';

import { useState } from 'react';

export default function PrivacyCenter() {
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-data-export.json';
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Deletion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy & Data Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Data Export */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">📥 Export Your Data</h2>
          <p className="text-gray-600 mb-4">
            Download all your personal data in JSON format
          </p>
          <button
            onClick={exportData}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Account Deletion */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🗑️ Delete Account</h2>
          <p className="text-gray-600 mb-4">
            Permanently delete your account and all associated data
          </p>
          <button
            onClick={deleteAccount}
            disabled={loading}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>

        {/* Cookie Preferences */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookie Settings</h2>
          <p className="text-gray-600 mb-4">
            Manage your cookie and tracking preferences
          </p>
          <button className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
            Manage Cookies
          </button>
        </div>

        {/* Data Usage */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">📊 Data Usage</h2>
          <p className="text-gray-600 mb-4">
            See how your data is being used and processed
          </p>
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
            View Usage
          </button>
        </div>
      </div>
    </div>
  );
}
