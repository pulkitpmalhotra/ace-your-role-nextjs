'use client';

import { useState, useEffect } from 'react';
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

interface UserProgress {
  category: string;
  total_sessions: number;
  total_minutes: number;
  average_score: number;
  best_score: number;
  last_session_date: string;
}

interface ProgressSummary {
  total_categories: number;
  total_sessions: number;
  total_minutes: number;
  overall_average_score: number;
  best_category: UserProgress | null;
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
  const [selectedView, setSelectedView] = useState<'scenarios' | 'progress'>('scenarios');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    initializeDashboard();
  }, [router]);

  const initializeDashboard = async () => {
    try {
      // Check if user is logged in
      const email = localStorage.getItem('userEmail');
      const name = localStorage.getItem('userName');
      
      if (!email) {
        console.log('❌ No user email found, redirecting to login');
        router.push('/');
        return;
      }

      console.log('✅ User found:', email);
      setUserEmail(email);
      setUserName(name || email.split('@')[0]);
      
      // Load dashboard data
      await loadData(email);
      
    } catch (err) {
      console.error('❌ Dashboard initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load dashboard. Please try refreshing the page.');
      setLoading(false);
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
        setError('Invalid user session. Please log in again.');
        setLoading(false);
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
          console.log('✅ Loaded progress for', progressData.data.progress?.length || 0, 'categories');
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
    if (!userEmail) {
      alert('Please refresh the page and log in again.');
      return;
    }
    
    console.log('🎯 Starting session with scenario:', scenario.title);
    localStorage.setItem('currentScenario', JSON.stringify(scenario));
    router.push(`/session/${scenario.id}`);
  };

  const viewAnalytics = () => {
    router.push('/analytics');
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentScenario');
    router.push('/');
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
      'healthcare': '🏥',
      'support': '🎧',
      'legal': '⚖️',
      'leadership': '👥'
    };
    return emojiMap[category] || '💬';
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
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
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Sign Out & Try Again
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
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Hi, {userName}!</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
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
        
        {/* Enhanced Quick Stats with Analytics */}
        {progressSummary ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{progressSummary.total_sessions}</div>
              <div className="text-sm text-gray-600">Sessions</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{progressSummary.total_minutes}m</div>
              <div className="text-sm text-gray-600">Practice Time</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(progressSummary.overall_average_score)}`}>
                {progressSummary.overall_average_score ? progressSummary.overall_average_score.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{progressSummary.streak_days}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            {/* Analytics Button */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-center text-white cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-all" onClick={viewAnalytics}>
              <div className="text-2xl font-bold">📊</div>
              <div className="text-sm">Analytics</div>
            </div>
          </div>
        ) : (
          /* New User Welcome */
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 mb-8 text-white text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Ace Your Role!</h2>
            <p className="text-blue-100 mb-4">Start your first conversation below to begin tracking your progress</p>
            <div className="bg-white/20 rounded-lg p-4 inline-block">
              <p className="text-sm">Ready to practice? Choose a scenario and start practicing!</p>
            </div>
          </div>
        )}

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
            📈 My Progress ({userProgress.length} categories)
          </button>
          <button
            onClick={viewAnalytics}
            className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
          >
            🔬 Advanced Analytics
          </button>
        </div>

        {/* Scenarios View */}
        {selectedView === 'scenarios' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Choose a Conversation</h2>
              <p className="text-gray-600">Select a scenario below and start practicing with AI characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <div 
                  key={scenario.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 hover:border-blue-200"
                >
                  {/* Category and Difficulty */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">
                      {getCategoryEmoji(scenario.category)}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {scenario.title}
                  </h3>
                  
                  {/* Description */}
                  {scenario.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {scenario.description}
                    </p>
                  )}
                  
                  {/* Character */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Talk with:</span> {scenario.character_name}
                    </p>
                    <p className="text-xs text-gray-600">{scenario.character_role}</p>
                  </div>
                  
                  {/* Start Button */}
                  <button
                    onClick={() => startChat(scenario)}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Start Scenario
                  </button>
                </div>
              ))}
            </div>

            {scenarios.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scenarios available</h3>
                <p className="text-gray-600 mb-4">We're loading conversation scenarios...</p>
                <button
                  onClick={() => loadData(userEmail)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Progress View */}
        {selectedView === 'progress' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Progress Summary</h2>
                <p className="text-gray-600">Track your improvement across different skill areas</p>
              </div>
              <button
                onClick={viewAnalytics}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
              >
                🔬 View Detailed Analytics
              </button>
            </div>

            {userProgress.length > 0 ? (
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div key={progress.category} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCategoryEmoji(progress.category)}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{progress.category}</h3>
                          <p className="text-sm text-gray-600">Last practiced: {formatDate(progress.last_session_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(progress.average_score)}`}>
                          {progress.average_score ? progress.average_score.toFixed(1) : '0.0'}/5.0
                        </div>
                        <div className="text-xs text-gray-600">Average Score</div>
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

        {/* Enhanced Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 text-center border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">✨ Enhanced Features Now Available!</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">🧠</span>
              <span className="font-medium">AI Analysis</span>
              <span>Get detailed feedback on your conversation skills</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">📊</span>
              <span className="font-medium">Progress Tracking</span>
              <span>Monitor improvement across multiple skill areas</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">💡</span>
              <span className="font-medium">Personalized Coaching</span>
              <span>Receive specific recommendations for growth</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
