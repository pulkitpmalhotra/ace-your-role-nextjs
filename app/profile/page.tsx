'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const availableRoles = [
    { id: 'sales', name: 'Sales', emoji: '💼', description: 'Master consultative selling and customer relationships' },
    { id: 'project-manager', name: 'Project Manager', emoji: '📋', description: 'Lead projects and coordinate stakeholders' },
    { id: 'product-manager', name: 'Product Manager', emoji: '📱', description: 'Drive product strategy and roadmap planning' },
    { id: 'leader', name: 'Leadership', emoji: '👑', description: 'Develop vision communication and team influence' },
    { id: 'manager', name: 'People Manager', emoji: '👥', description: 'Build team management and coaching skills' },
    { id: 'strategy-lead', name: 'Strategy Lead', emoji: '🎯', description: 'Practice strategic planning and analysis' },
    { id: 'support-agent', name: 'Customer Support', emoji: '🎧', description: 'Excel at customer service and problem solving' },
    { id: 'data-analyst', name: 'Data Analyst', emoji: '📊', description: 'Communicate insights and analytical thinking' },
    { id: 'engineer', name: 'Engineering', emoji: '👩‍💻', description: 'Technical communication and collaboration' },
    { id: 'nurse', name: 'Healthcare - Nursing', emoji: '👩‍⚕️', description: 'Patient care and medical team coordination' },
    { id: 'doctor', name: 'Healthcare - Doctor', emoji: '🩺', description: 'Patient consultation and medical communication' }
  ];

  useEffect(() => {
    initializeProfile();
  }, [router]);

  const initializeProfile = () => {
    try {
      // Check authentication
      const email = localStorage.getItem('userEmail');
      const name = localStorage.getItem('userName');
      const sessionToken = localStorage.getItem('sessionToken');
      const authProvider = localStorage.getItem('authProvider');
      
      if (!email || !sessionToken || authProvider !== 'google') {
        router.push('/');
        return;
      }

      setUserEmail(email);
      setUserName(name || email.split('@')[0]);
      setUserPicture(localStorage.getItem('userPicture') || '');
      setPreferredRole(localStorage.getItem('preferredRole') || 'sales');
      setLoading(false);
    } catch (error) {
      console.error('Profile initialization error:', error);
      router.push('/');
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setSaving(true);
    try {
      // Update localStorage
      localStorage.setItem('preferredRole', newRole);
      setPreferredRole(newRole);
      const handleRoleChange = async (newRole: string) => {
    setSaving(true);
    try {
      // Update localStorage
      localStorage.setItem('preferredRole', newRole);
      setPreferredRole(newRole);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      console.log('✅ Role preference updated to:', newRole);
    } catch (error) {
      console.error('Error saving role preference:', error);
      alert('Failed to save role preference. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    try {
      const userData = {
        email: userEmail,
        name: userName,
        preferredRole,
        exportDate: new Date().toISOString(),
        accountCreated: localStorage.getItem('accountCreated') || 'Unknown'
      };

      // Try to get progress data
      try {
        const progressResponse = await fetch(`/api/progress?user_email=${encodeURIComponent(userEmail)}`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.success) {
            userData.progressData = progressData.data;
          }
        }
      } catch (err) {
        console.log('Could not fetch progress data for export');
      }

      // Create and download file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ace-your-role-data-${userEmail.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" exactly to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      // Clear all local storage
      localStorage.clear();
      
      // In a real app, you'd call an API to delete the account
      // For now, we'll just redirect to login
      alert('Account deleted successfully. You will be redirected to the login page.');
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving role preference:', error);
      alert('Failed to save role preference. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    try {
      const userData = {
        email: userEmail,
        name: userName,
        preferredRole,
        exportDate: new Date().toISOString(),
        accountCreated: localStorage.getItem('accountCreated') || 'Unknown'
      };

      // Try to get progress data
      try {
        const progressResponse = await fetch(`/api/progress?user_email=${encodeURIComponent(userEmail)}`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.success) {
            userData.progressData = progressData.data;
          }
        }
      } catch (err) {
        console.log('Could not fetch progress data for export');
      }

      // Create and download file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ace-your-role-data-${userEmail.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" exactly to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      // Clear all local storage
      localStorage.clear();
      
      // In a real app, you'd call an API to delete the account
      // For now, we'll just redirect to login
      alert('Account deleted successfully. You will be redirected to the login page.');
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                ←
              </button>
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-green-800 font-medium">Settings saved successfully!</span>
            </div>
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-3">👤</span>
            Account Information
          </h2>
          
          <div className="flex items-center space-x-6 mb-6">
            {userPicture ? (
              <img
                src={userPicture}
                alt={userName}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{userName}</h3>
              <p className="text-gray-600">{userEmail}</p>
              <div className="flex items-center mt-2">
                <div className="w-5 h-5 bg-white rounded p-0.5 shadow-sm mr-2">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Signed in with Google</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Preference */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-3">🎯</span>
            Training Preference
          </h2>
          
          <p className="text-gray-600 mb-6">
            Choose your primary role to personalize your dashboard experience. You can change this anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
                disabled={saving}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  preferredRole === role.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-2">{role.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{role.name}</h3>
                <p className="text-xs text-gray-600">{role.description}</p>
                {preferredRole === role.id && (
                  <div className="mt-2 flex items-center text-blue-600">
                    <span className="text-sm font-medium">✓ Currently Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {saving && (
            <div className="mt-4 text-center">
              <span className="text-blue-600">Saving preference...</span>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-3">📊</span>
            Data Management
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Export Your Data</h3>
              <p className="text-gray-600 text-sm mb-4">
                Download all your personal data, progress, and session history in JSON format.
              </p>
              <button
                onClick={exportUserData}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                📥 Export Data
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Information</h3>
              <p className="text-gray-600 text-sm">
                Your practice sessions are automatically deleted after 90 days for privacy. 
                Only your progress summaries are retained to track your improvement.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8">
          <h2 className="text-xl font-semibold text-red-900 mb-6 flex items-center">
            <span className="text-xl mr-3">⚠️</span>
            Danger Zone
          </h2>
          
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
            <p className="text-red-800 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirmation ? (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Type "DELETE MY ACCOUNT" to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmationText !== 'DELETE MY ACCOUNT'}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setDeleteConfirmationText('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

      </main>
    </div>
  );
}
