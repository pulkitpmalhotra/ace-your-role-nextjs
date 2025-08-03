// components/CookieConsent.tsx
'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowConsent(false);
  };

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-lg z-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">🍪 Cookie Preferences</h3>
        <p className="text-gray-600 mb-4">
          We use cookies to improve your experience and analyze usage. You can customize your preferences below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={preferences.necessary} 
              disabled 
              className="rounded"
            />
            <span className="text-sm">
              <strong>Necessary</strong> - Required for basic functionality
            </span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={preferences.analytics}
              onChange={(e) => setPreferences(prev => ({...prev, analytics: e.target.checked}))}
              className="rounded"
            />
            <span className="text-sm">
              <strong>Analytics</strong> - Help us improve the service
            </span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={preferences.marketing}
              onChange={(e) => setPreferences(prev => ({...prev, marketing: e.target.checked}))}
              className="rounded"
            />
            <span className="text-sm">
              <strong>Marketing</strong> - Personalized content
            </span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={acceptAll}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Accept All
          </button>
          <button 
            onClick={acceptSelected}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
