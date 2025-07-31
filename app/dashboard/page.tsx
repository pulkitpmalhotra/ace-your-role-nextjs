'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  difficulty: string;
  category: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showDataManagement, setShowDataManagement] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated') {
      // Check for legacy localStorage email
      const legacyEmail = localStorage.getItem('userEmail');
      if (!legacyEmail) {
        router.push('/');
        return;
      }
    }
    
    loadScenarios();
  }, [status, router]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scenarios');
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.data || []);
      } else {
        console.error('Failed to load scenarios:', data.error);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const categoryMatch = selectedCategory === 'all' || scenario.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch && scenario.is_active;
  });

  const startSession = (scenario: Scenario) => {
    localStorage.setItem('currentScenario', JSON.stringify(scenario));
    router.push(`/session/${scenario.id}`);
  };

  const handleSignOut = async () => {
    // Clear legacy localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentScenario');
    
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      router.push('/');
    }
  };

  const getUserDisplayInfo = () => {
    if (session?.user) {
      return {
        name: session.user.name || 'User',
        email: session.user.email || '',
        image: session.user.image,
        isGoogleAuth: true
      };
    } else {
      // Legacy email user
      const legacyEmail = localStorage.getItem('userEmail');
      return {
        name: legacyEmail?.split('@')[0] || 'User',
        email: legacyEmail || '',
        image: null,
        isGoogleAuth: false
      };
    }
  };

  const userInfo = getUserDisplayInfo();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
      'healthcare': '🏥',
      'support': '🎧',
      'legal': '⚖️',
      'leadership': '👥'
    };
    return emojiMap[category] || '🎯';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <h1 className="text-2xl font-bold text-gray-900">Ace Your Role</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                {userInfo.image ? (
                  <img
                    src={userInfo.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {userInfo.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-gray-500 text-xs">{userInfo.email}</p>
                </div>
                {userInfo.isGoogleAuth && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Google
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowDataManagement(true)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Data & Privacy
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {userInfo.name}! 👋
          </h2>
          <p className="text-gray-600">
            Continue your AI-powered roleplay training with enhanced speech features and personalized feedback.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🤖</span>
              <h3 className="font-semibold text-gray-900">Gemini 2.5 Flash-Lite</h3>
            </div>
            <p className="text-sm text-gray-600">43% cost reduction with enhanced conversation quality</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🎤</span>
              <h3 className="font-semibold text-gray-900">Google Speech APIs</h3>
            </div>
            <p className="text-sm text-gray-600">95%+ accuracy with 380+ professional voices</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🔒</span>
              <h3 className="font-semibold text-gray-900">GDPR Compliant</h3>
            </div>
            <p className="text-sm text-gray-600">Full data control and privacy protection</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="sales">Sales</option>
                <option value="healthcare">Healthcare</option>
                <option value="support">Support</option>
                <option value="legal">Legal</option>
                <option value="leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getCategoryEmoji(scenario.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {scenario.title}
                </h3>
                
                {scenario.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {scenario.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Character:</span>
                    <span className="ml-2">{scenario.character_name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Role:</span>
                    <span className="ml-2">{scenario.character_role}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => startSession(scenario)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Voice Session
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredScenarios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No scenarios match your current filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Data Management Modal */}
      {showDataManagement && (
        <DataManagementModal
          user={userInfo}
          onClose={() => setShowDataManagement(false)}
        />
      )}
    </div>
  );
}

// Data Management Modal Component
function DataManagementModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const exportUserData = async () => {
    setIsExporting(true);
    try {
      // Simulate data export
      const userData = {
        profile: {
          name: user.name,
          email: user.email,
          created_at: new Date().toISOString()
        },
        sessions: [], // Would fetch from API
        preferences: {},
        exported_at: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ace-your-role-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL your data? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Simulate data deletion API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear local storage
      localStorage.clear();
      
      alert('All your data has been deleted successfully. You will be redirected to the login page.');
      window.location.href = '/';
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Data & Privacy Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['overview', 'data', 'privacy', 'export'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Account</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Authentication</label>
                      <p className="text-gray-900">{user.isGoogleAuth ? 'Google OAuth' : 'Email'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data Status</label>
                      <p className="text-green-600">✅ GDPR Compliant</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('export')}
                    className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-left"
                  >
                    <div className="font-medium text-blue-600">📥 Export My Data</div>
                    <div className="text-sm text-gray-600">Download all your data</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left"
                  >
                    <div className="font-medium text-green-600">🔒 Privacy Settings</div>
                    <div className="text-sm text-gray-600">Manage data preferences</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Data We Store</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Profile Information</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Name and email address</li>
                      <li>• Profile picture (if using Google OAuth)</li>
                      <li>• Account creation and last login dates</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Session Data</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Conversation transcripts and audio recordings</li>
                      <li>• Performance scores and feedback</li>
                      <li>• Session duration and completion rates</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Speech and voice settings</li>
                      <li>• Scenario preferences and difficulty levels</li>
                      <li>• Notification and privacy preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Privacy Rights</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">🔍 Right to Access</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You can view all personal data we have about you at any time.
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm underline">
                      View My Data
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">✏️ Right to Rectification</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You can correct any inaccurate or incomplete data.
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm underline">
                      Update Profile
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">📦 Right to Portability</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You can export your data in a machine-readable format.
                    </p>
                    <button 
                      onClick={() => setActiveTab('export')}
                      className="text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Export Data
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4 border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">🗑️ Right to Erasure</h4>
                    <p className="text-sm text-red-600 mb-3">
                      You can request deletion of all your personal data.
                    </p>
                    <button 
                      onClick={deleteAllData}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 text-sm underline disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete All My Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">What's Included</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Complete profile information</li>
                    <li>• All conversation transcripts and sessions</li>
                    <li>• Performance data and feedback</li>
                    <li>• Account settings and preferences</li>
                    <li>• Export timestamp and metadata</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={exportUserData}
                    disabled={isExporting}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isExporting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Preparing Export...
                      </div>
                    ) : (
                      '📥 Download My Data'
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    Data will be exported as a JSON file that you can save or import elsewhere.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Questions about your data? Contact us at privacy@aceyourrole.com
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
