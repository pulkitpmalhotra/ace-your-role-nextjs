'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  difficulty: string;
  role: string;
  is_active: boolean;
}

interface UserProgress {
  role: string;
  total_sessions: number;
  total_minutes: number;
  average_score: number;
  best_score: number;
  last_session_date: string;
}

interface ProgressSummary {
  total_roles: number;
  total_sessions: number;
  total_minutes: number;
  overall_average_score: number;
  best_role: UserProgress | null;
  days_active: number;
  streak_days: number;
}

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [authProvider, setAuthProvider] = useState('email');
  const [selectedView, setSelectedView] = useState<'scenarios' | 'progress'>('scenarios');
  const [selectedRole, setSelectedRole] = useState<string>('sales'); // Default to sales
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    initializeDashboard();
  }, [router]);

  // Get available roles from scenarios
  const availableRoles = Array.from(new Set(scenarios.map(s => s.role)));
  
  // Filter scenarios based on selected filters
  const filteredScenarios = scenarios.filter(scenario => {
    const roleMatch = selectedRole === 'all' || scenario.role === selectedRole;
    const difficultyMatch = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty;
    const searchMatch = searchQuery === '' || 
      scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.character_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return roleMatch && difficultyMatch && searchMatch;
  });

  // Sort filtered scenarios by difficulty
  const sortedFilteredScenarios = [...filteredScenarios].sort((a, b) => {
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4) - 
           (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4);
  });

  const getRoleEmoji = (role: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
      'project-manager': '📋',
      'product-manager': '📱', 
      'leader': '👑',
      'manager': '👥',
      'strategy-lead': '🎯',
      'support-agent': '🎧',
      'data-analyst': '📊',
      'engineer': '👩‍💻',
      'nurse': '👩‍⚕️',
      'doctor': '🩺'
    };
    return emojiMap[role] || '💬';
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      'sales': 'Practice consultative selling and customer relationship building',
      'project-manager': 'Master project coordination, timeline management, and stakeholder communication',
      'product-manager': 'Develop product strategy, roadmap planning, and cross-functional leadership',
      'leader': 'Practice vision communication, strategic thinking, and organizational influence',
      'manager': 'Develop team management, performance coaching, and people leadership skills',
      'strategy-lead': 'Practice strategic planning, market analysis, and executive communication',
      'support-agent': 'Master customer service, problem resolution, and technical support skills',
      'data-analyst': 'Practice data presentation, insights communication, and analytical thinking',
      'engineer': 'Develop technical communication, code reviews, and solution architecture discussions',
      'nurse': 'Practice patient care communication, medical team coordination, and healthcare protocols',
      'doctor': 'Develop patient consultation skills, diagnosis communication, and medical decision-making'
    };
    return descriptions[role] || 'Professional communication practice';
  };

  const initializeDashboard = async () => {
    try {
      // Check if user is logged in with Google OAuth
      const email = localStorage.getItem('userEmail');
      const name = localStorage.getItem('userName');
      const sessionToken = localStorage.getItem('sessionToken');
      const authProvider = localStorage.getItem('authProvider');
      
      if (!email || !sessionToken || authProvider !== 'google') {
        console.log('❌ No valid Google OAuth session found, redirecting to login');
        // Clear any invalid session data
        localStorage.clear();
        router.push('/');
        return;
      }

      console.log('✅ Google OAuth user found:', email);
      setUserEmail(email);
      setUserName(name || email.split('@')[0]);
      setUserPicture(localStorage.getItem('userPicture') || '');
      setAuthProvider('google');
      
      // Load dashboard data
      await loadData(email);
      
    } catch (err) {
      console.error('❌ Dashboard initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load dashboard. Please sign in again.');
      setLoading(false);
      // Clear session and redirect to login
      localStorage.clear();
      setTimeout(() => router.push('/'), 2000);
    }
  };

  const loadData = async (email?: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Use provided email or fall back to state
      const emailToUse = email || userEmail;
      
      // Validate email before making API calls
      if (!emailToUse || !emailToUse.includes('@')) {
        console.error('❌ Invalid email for API calls:', emailToUse);
        setError('Invalid Google OAuth session. Please sign in again.');
        setLoading(false);
        localStorage.clear();
        setTimeout(() => router.push('/'), 2000);
        return;
      }
      
      console.log('📊 Loading dashboard data for:', emailToUse);
      
      // Load scenarios first (always available)
      console.log('📚 Loading scenarios...');
      const scenariosResponse = await fetch('/api/scenarios');
      if (scenariosResponse.ok) {
        const scenariosData = await scenariosResponse.json();
        if (scenariosData.success) {
          setScenarios(scenariosData.data || []);
          console.log('✅ Loaded', scenariosData.data?.length || 0, 'scenarios');
        }
      } else {
        console.warn('⚠️ Failed to load scenarios:', scenariosResponse.status);
      }
      
      // Load user progress (may not exist for new users)
      console.log('📈 Loading user progress for:', emailToUse);
      const progressUrl = `/api/progress?user_email=${encodeURIComponent(emailToUse)}`;
      console.log('🔗 Progress API URL:', progressUrl);
      
      const progressResponse = await fetch(progressUrl);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.success) {
          setUserProgress(progressData.data.progress || []);
          setProgressSummary(progressData.data.summary);
          console.log('✅ Loaded progress for', progressData.data.progress?.length || 0, 'roles');
        } else {
          console.log('ℹ️ No progress data yet:', progressData.error);
          // This is normal for new users
          setUserProgress([]);
          setProgressSummary(null);
        }
      } else if (progressResponse.status === 400) {
        console.log('ℹ️ User progress not found - new user');
        setUserProgress([]);
        setProgressSummary(null);
      } else {
        console.warn('⚠️ Failed to load progress:', progressResponse.status);
        setUserProgress([]);
        setProgressSummary(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('Failed to load some data. The app should still work for starting new sessions.');
    } finally {
      setLoading(false);
    }
  };

  const startChat = (scenario: Scenario) => {
    const sessionToken = localStorage.getItem('sessionToken');
    const authProvider = localStorage.getItem('authProvider');
    
    if (!userEmail || !sessionToken || authProvider !== 'google') {
      alert('Please sign in with Google to start practicing.');
      localStorage.clear();
      router.push('/');
      return;
    }
    
    console.log('🎯 Starting session with scenario:', scenario.title);
    localStorage.setItem('currentScenario', JSON.stringify(scenario));
    router.push(`/session/${scenario.id}`);
  };

  const viewAnalyticsDashboard = () => {
    router.push('/analytics');
  };

  const logout = () => {
    console.log('🚪 Logging out Google OAuth user');
    // Clear all session data
    localStorage.clear();
    
    // Redirect to Google logout and then to our login page
    const googleLogoutUrl = 'https://accounts.google.com/logout';
    const returnUrl = encodeURIComponent(window.location.origin);
    
    // Open Google logout in a popup to clear Google session
    const popup = window.open(googleLogoutUrl, 'logout', 'width=500,height=500');
    
    // Close popup and redirect after a brief delay
    setTimeout(() => {
      if (popup) popup.close();
      router.push('/');
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
                <p className="text-sm text-gray-600">AI-powered conversation training</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="flex items-center space-x-3">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback avatar with initials */}
                <div 
                  className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${userPicture ? 'hidden' : 'flex'}`}
                >
                  {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">Hi, {userName}!</p>
                    {/* Google OAuth indicator */}
                    <div className="w-5 h-5 bg-white rounded p-0.5 shadow-sm" title="Signed in with Google">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedView('scenarios')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'scenarios' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            🎯 Practice Scenarios ({scenarios.length})
          </button>
          <button
            onClick={() => setSelectedView('progress')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'progress' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            📈 My Progress ({userProgress.length} roles)
          </button>
        </div>

        {/* Scenarios View */}
        {selectedView === 'scenarios' && (
          <div>
            {/* Header with Role Selection */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Practice Scenario</h2>
                  <p className="text-gray-600">Select a role and difficulty to start your AI-powered conversation training</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedRole('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole === 'all' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  All Roles ({scenarios.length})
                </button>
                {availableRoles.map((role) => {
                  const roleScenarios = scenarios.filter(s => s.role === role);
                  const userProgressForRole = userProgress.find(p => p.role === role);
                  
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        selectedRole === role 
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{getRoleEmoji(role)}</span>
                      <span className="capitalize">{role.replace('-', ' ')}</span>
                      <span className="text-sm opacity-75">({roleScenarios.length})</span>
                      {userProgressForRole && (
                        <span className={`w-2 h-2 rounded-full ${
                          userProgressForRole.average_score >= 4 ? 'bg-green-400' :
                          userProgressForRole.average_score >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Difficulty and Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Difficulty:</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>📊 {filteredScenarios.length} scenarios found</span>
                  {selectedRole !== 'all' && (
                    <span>🎯 {getRoleDescription(selectedRole).split(' ').slice(0, 4).join(' ')}...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Scenarios Grid */}
            {filteredScenarios.length > 0 ? (
              <>
                {selectedRole !== 'all' && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-2xl">{getRoleEmoji(selectedRole)}</div>
                      <h3 className="text-lg font-semibold text-blue-900 capitalize">
                        {selectedRole.replace('-', ' ')} Practice
                      </h3>
                    </div>
                    <p className="text-blue-800 text-sm">
                      {getRoleDescription(selectedRole)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedFilteredScenarios.map((scenario) => (
                    <div key={scenario.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 hover:border-blue-200">
                      {/* Difficulty Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                          {scenario.difficulty}
                        </span>
                        {selectedRole === 'all' && (
                          <span className="text-lg">{getRoleEmoji(scenario.role)}</span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {scenario.title}
                      </h4>
                      
                      {/* Description */}
                      <div className="flex-grow mb-4">
                        {scenario.description && (
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {scenario.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Character Info */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Character:</span> {scenario.character_name}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1">{scenario.character_role}</p>
                        {selectedRole === 'all' && (
                          <p className="text-xs text-blue-600 capitalize mt-1">
                            {scenario.role.replace('-', ' ')} scenario
                          </p>
                        )}
                      </div>
                      
                      {/* Progress Indicator */}
                      {(() => {
                        const roleProgress = userProgress.find(p => p.role === scenario.role);
                        return roleProgress ? (
                          <div className="mb-4 p-2 bg-gray-50 rounded">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Your {scenario.role} progress</span>
                              <span>{roleProgress.average_score.toFixed(1)}/5.0</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${
                                  roleProgress.average_score >= 4 ? 'bg-green-500' :
                                  roleProgress.average_score >= 3 ? 'bg-blue-500' :
                                  roleProgress.average_score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(roleProgress.average_score / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                      
                      {/* Start Button */}
                      <button
                        onClick={() => startChat(scenario)}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >
                        Start Practice
                      </button>
                    </div>
                  ))}
                </div>

                {/* Practice Tips */}
                {selectedRole !== 'all' && sortedFilteredScenarios.length > 0 && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <span className="text-lg mr-2">💡</span>
                      {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1).replace('-', ' ')} Practice Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                      {(() => {
                        const tips: Record<string, string[]> = {
                          'sales': [
                            '🎯 Focus on understanding customer needs before presenting solutions',
                            '🤝 Build rapport and trust through active listening and empathy',
                            '💡 Ask open-ended questions to uncover pain points',
                            '📈 Always connect features to specific customer benefits'
                          ],
                          'project-manager': [
                            '📋 Clearly define project scope, timeline, and deliverables',
                            '👥 Identify and manage stakeholder expectations early',
                            '⚠️ Proactively address risks and dependencies',
                            '📊 Communicate progress and blockers transparently'
                          ],
                          'product-manager': [
                            '👤 Start with user needs and validate with data',
                            '🎯 Prioritize features based on impact and feasibility',
                            '🔄 Gather feedback from engineering, design, and business teams',
                            '📈 Define success metrics and measure outcomes'
                          ],
                          'leader': [
                            '🎯 Communicate vision clearly and inspire action',
                            '👂 Listen actively and show genuine care for team members',
                            '🤝 Build consensus while making decisive choices',
                            '🌱 Focus on developing others and building trust'
                          ],
                          'manager': [
                            '🎯 Set clear expectations and provide regular feedback',
                            '👂 Listen to understand, not just to respond',
                            '🌱 Focus on development and growth opportunities',
                            '⚖️ Balance support with accountability'
                          ],
                          'strategy-lead': [
                            '📊 Use data and market insights to support recommendations',
                            '🎯 Connect tactical decisions to strategic objectives',
                            '🔮 Consider long-term implications and scenarios',
                            '🤝 Build buy-in through clear communication and collaboration'
                          ],
                          'support-agent': [
                            '👂 Listen carefully and acknowledge customer frustration',
                            '🔍 Ask clarifying questions to understand the real issue',
                            '✅ Provide step-by-step solutions and confirm understanding',
                            '🤝 Follow up to ensure complete resolution'
                          ],
                          'data-analyst': [
                            '❓ Ask clarifying questions about business objectives',
                            '📊 Present insights clearly with visual aids',
                            '🎯 Focus on actionable recommendations, not just data',
                            '✅ Validate findings and consider alternative explanations'
                          ],
                          'engineer': [
                            '🎯 Understand requirements fully before proposing solutions',
                            '⚖️ Balance technical excellence with practical constraints',
                            '💬 Explain technical concepts in business terms',
                            '🤝 Collaborate effectively with non-technical stakeholders'
                          ],
                          'nurse': [
                            '❤️ Show empathy and maintain patient dignity',
                            '💬 Communicate clearly about procedures and care plans',
                            '👥 Coordinate effectively with the medical team',
                            '📋 Document thoroughly and follow safety protocols'
                          ],
                          'doctor': [
                            '👂 Listen actively to patient concerns and symptoms',
                            '💬 Explain conditions and treatments in understandable terms',
                            '🤝 Involve patients in treatment decisions',
                            '❤️ Show empathy while maintaining professional boundaries'
                          ]
                        };
                        
                        const roleTips = tips[selectedRole] || tips['sales'];
                        return roleTips.map((tip, index) => (
                          <div key={index} className="flex items-start">
                            <span className="mr-2 text-green-600">{tip.split(' ')[0]}</span>
                            <span>{tip.split(' ').slice(1).join(' ')}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scenarios found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? (
                    <>No scenarios match your search "{searchQuery}". Try different keywords or filters.</>
                  ) : (
                    <>No scenarios available for the selected filters. Try adjusting your filters.</>
                  )}
                </p>
                <div className="space-x-4">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRole('all');
                      setSelectedDifficulty('all');
                      setSearchQuery('');
                    }}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress View */}
        {selectedView === 'progress' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Progress Summary</h2>
                <p className="text-gray-600">Track your improvement across different professional roles</p>
              </div>
              {/* Single consolidated Analytics Dashboard button */}
              {userProgress.length > 0 && (
                <button
                  onClick={viewAnalyticsDashboard}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <span className="text-lg">📊</span>
                  <span>Analytics Dashboard</span>
                </button>
              )}
            </div>

            {userProgress.length > 0 ? (
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div key={progress.role} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getRoleEmoji(progress.role)}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{progress.role.replace('-', ' ')}</h3>
                          <p className="text-sm text-gray-600">Last practiced: {formatDate(progress.last_session_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(progress.average_score)}`}>
                          {progress.average_score ? progress.average_score.toFixed(1) : '0.0'}/5.0
                        </div>
                        <div className="text-xs text-gray-500">Average Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{progress.total_sessions}</div>
                        <div className="text-xs text-gray-600">Sessions</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{progress.total_minutes}m</div>
                        <div className="text-xs text-gray-600">Time</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getScoreColor(progress.best_score)}`}>
                          {progress.best_score ? progress.best_score.toFixed(1) : '0.0'}
                        </div>
                        <div className="text-xs text-gray-600">Best Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No progress data yet</h3>
                <p className="text-gray-600 mb-6">Complete your first conversation to start tracking progress</p>
                <button
                  onClick={() => setSelectedView('scenarios')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Start Your First Session
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
