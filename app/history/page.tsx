'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  start_time: string;
  duration_minutes: number;
  overall_score: number;
  session_status: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  conversation: Array<{
    speaker: 'user' | 'ai';
    message: string;
    timestamp: number;
  }>;
  scenarios: {
    id: string;
    title: string;
    character_name: string;
    character_role: string;
    role: string;
    difficulty: string;
  } | null;
  conversation_metadata?: {
    natural_ending?: boolean;
    session_quality?: string;
    total_exchanges?: number;
    objectives_completed?: number;
    objectives_total?: number;
  };
}

interface HistoryData {
  sessions: Session[];
  summary: {
    total_sessions: number;
    total_minutes: number;
    average_score: number;
    best_score: number;
    completed_sessions: number;
    roles_practiced: string[];
  };
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'recent'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [error, setError] = useState('');
  
  const router = useRouter();

  const roleEmojis: Record<string, string> = {
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

  useEffect(() => {
    initializeHistory();
  }, [router]);

  const initializeHistory = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const sessionToken = localStorage.getItem('sessionToken');
      const authProvider = localStorage.getItem('authProvider');
      
      console.log('📊 History page - checking auth:', { email: !!email, sessionToken: !!sessionToken, authProvider });
      
      if (!email || !sessionToken || authProvider !== 'google') {
        console.log('❌ No valid auth found, redirecting...');
        router.push('/');
        return;
      }

      setUserEmail(email);
      console.log('📊 Loading history for user:', email);
      await loadHistoryData(email);
    } catch (error) {
      console.error('History initialization error:', error);
      setError('Failed to load session history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryData = async (email: string) => {
    try {
      console.log('📊 Fetching sessions from API for:', email);
      
      // Load user sessions with detailed logging
      const sessionsUrl = `/api/sessions?user_email=${encodeURIComponent(email)}`;
      console.log('📊 Sessions API URL:', sessionsUrl);
      
      const sessionsResponse = await fetch(sessionsUrl);
      console.log('📊 Sessions API response status:', sessionsResponse.status);
      
      if (!sessionsResponse.ok) {
        const errorText = await sessionsResponse.text();
        console.error('❌ Sessions API failed:', sessionsResponse.status, errorText);
        throw new Error(`Failed to load session history: ${sessionsResponse.status}`);
      }

      const sessionsData = await sessionsResponse.json();
      console.log('📊 Sessions API response:', sessionsData);
      
      if (!sessionsData.success) {
        console.error('❌ Sessions API returned error:', sessionsData.error);
        throw new Error(sessionsData.error || 'Failed to load sessions');
      }

      let sessions = sessionsData.data || [];
      console.log('📊 Raw sessions data:', sessions.length, 'sessions');

      // Ensure sessions is an array
      if (!Array.isArray(sessions)) {
        console.error('❌ Sessions data is not an array:', typeof sessions);
        sessions = [];
      }

      // Log first session for debugging
      if (sessions.length > 0) {
        console.log('📊 First session sample:', JSON.stringify(sessions[0], null, 2));
      }

      // Filter and process sessions
      const validSessions = sessions.filter((session: any) => {
        const isValid = session && session.id && session.start_time;
        if (!isValid) {
          console.warn('⚠️ Invalid session found:', session);
        }
        return isValid;
      });

      console.log('📊 Valid sessions:', validSessions.length);

      // Calculate summary statistics
      const completedSessions = validSessions.filter((s: Session) => s.session_status === 'completed');
      console.log('📊 Completed sessions:', completedSessions.length);

      const totalMinutes = completedSessions.reduce((sum: number, s: Session) => sum + (s.duration_minutes || 0), 0);
      const averageScore = completedSessions.length > 0 
        ? completedSessions.reduce((sum: number, s: Session) => sum + (s.overall_score || 0), 0) / completedSessions.length
        : 0;
      const bestScore = completedSessions.length > 0 
        ? Math.max(...completedSessions.map((s: Session) => s.overall_score || 0))
        : 0;
      
      // Get unique roles practiced
      const rolesSet = new Set<string>();
      validSessions.forEach((s: Session) => {
        if (s.scenarios?.role) {
          rolesSet.add(s.scenarios.role);
        }
      });
      const rolesPracticed = Array.from(rolesSet);

      const summary = {
        total_sessions: validSessions.length,
        total_minutes: totalMinutes,
        average_score: Math.round(averageScore * 100) / 100,
        best_score: Math.round(bestScore * 100) / 100,
        completed_sessions: completedSessions.length,
        roles_practiced: rolesPracticed
      };

      console.log('📊 Summary calculated:', summary);

      setHistoryData({ 
        sessions: validSessions, 
        summary 
      });
      
      console.log(`✅ Successfully loaded ${validSessions.length} sessions`);
      
    } catch (error) {
      console.error('❌ Error loading history data:', error);
      setError(`Failed to load session history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredSessions = historyData?.sessions.filter(session => {
    // Filter by completion status
    if (selectedFilter === 'completed' && session.session_status !== 'completed') return false;
    if (selectedFilter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(session.start_time) < weekAgo) return false;
    }

    // Filter by role
    if (selectedRole !== 'all' && session.scenarios?.role !== selectedRole) return false;

    return true;
  }) || [];

  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  const viewFeedback = (session: Session) => {
    if (session.session_status !== 'completed') {
      alert('Feedback is only available for completed sessions.');
      return;
    }

    // Store session data for feedback page
    const sessionData = {
      scenario: session.scenarios,
      sessionId: session.id,
      duration: session.duration_minutes || 0,
      exchanges: Math.floor((session.conversation?.length || 0) / 2),
      userEmail: userEmail,
      conversation: session.conversation || [],
      objectives: [], // Will be reconstructed in feedback page
      objectivesCompleted: session.conversation_metadata?.objectives_completed || 0,
      sessionContext: {
        startTime: new Date(session.start_time).getTime(),
        naturalEnding: session.conversation_metadata?.natural_ending || false,
        sessionQuality: session.conversation_metadata?.session_quality || 'basic'
      }
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 3.5) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'sales': 'Sales',
      'project-manager': 'Project Manager',
      'product-manager': 'Product Manager',
      'leader': 'Leadership',
      'manager': 'People Manager',
      'strategy-lead': 'Strategy Lead',
      'support-agent': 'Customer Support',
      'data-analyst': 'Data Analyst',
      'engineer': 'Engineering',
      'nurse': 'Healthcare - Nursing',
      'doctor': 'Healthcare - Doctor'
    };
    return roleNames[role] || role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your History</h2>
          <p className="text-gray-600">Retrieving your practice sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Loading Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                initializeHistory();
              }}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Retry Loading
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Session History</h1>
            <p className="text-xl text-gray-600">Review your practice sessions and track your progress</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Statistics */}
        {historyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🎯</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{historyData.summary.total_sessions}</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {historyData.summary.completed_sessions} completed
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">⏱️</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{historyData.summary.total_minutes}</div>
                  <div className="text-sm text-gray-600">Minutes Practiced</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round((historyData.summary.total_minutes || 0) / 60)}+ hours total
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📈</div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(historyData.summary.average_score || 0)}`}>
                    {historyData.summary.average_score ? historyData.summary.average_score.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Best: {historyData.summary.best_score ? historyData.summary.best_score.toFixed(1) : '0.0'}/5.0
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🎭</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{historyData.summary.roles_practiced.length}</div>
                  <div className="text-sm text-gray-600">Roles Practiced</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Professional variety
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'completed' | 'recent')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="completed">Completed Only</option>
                <option value="recent">Last 7 Days</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {historyData?.summary.roles_practiced.map(role => (
                  <option key={role} value={role}>
                    {roleEmojis[role]} {getRoleDisplayName(role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {sortedSessions.length} of {historyData?.sessions.length || 0} sessions
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {sortedSessions.length > 0 ? (
          <div className="space-y-4">
            {sortedSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {roleEmojis[session.scenarios?.role || ''] || '💬'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {session.scenarios?.title || 'Practice Session'}
                      </h3>
                      <p className="text-gray-600">
                        with {session.scenarios?.character_name || 'AI Character'} • {session.scenarios?.difficulty || 'Unknown'} level
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(session.start_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Session Stats */}
                    <div className="text-right">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="font-medium">{session.duration_minutes || 0}m</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Score:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadge(session.overall_score || 0)}`}>
                          {session.overall_score ? session.overall_score.toFixed(1) : 'N/A'}/5.0
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => viewFeedback(session)}
                        disabled={session.session_status !== 'completed'}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          session.session_status === 'completed'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {session.session_status === 'completed' ? '📊 View Feedback' : '⏳ In Progress'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {session.conversation_metadata?.total_exchanges || Math.floor((session.conversation?.length || 0) / 2)}
                    </div>
                    <div className="text-xs text-gray-600">Exchanges</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {getRoleDisplayName(session.scenarios?.role || '')}
                    </div>
                    <div className="text-xs text-gray-600">Role Practiced</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {session.conversation_metadata?.natural_ending ? '✅' : '⏸️'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {session.conversation_metadata?.natural_ending ? 'Natural End' : 'Manual End'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      session.session_status === 'completed' ? 'text-green-600' :
                      session.session_status === 'active' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {session.session_status === 'completed' ? '✓' :
                       session.session_status === 'active' ? '⏳' : '❌'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {session.session_status.charAt(0).toUpperCase() + session.session_status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Quality Indicator */}
                {session.conversation_metadata?.session_quality && (
                  <div className="mt-3 flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.conversation_metadata.session_quality === 'excellent' ? 'bg-purple-100 text-purple-800' :
                      session.conversation_metadata.session_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.conversation_metadata.session_quality} quality conversation
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {historyData?.sessions.length === 0 ? 'No Sessions Yet' : 'No Sessions Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {historyData?.sessions.length === 0 
                ? "You haven't completed any practice sessions yet. Start practicing to see your history here!"
                : 'No sessions match your current filters. Try adjusting your search criteria.'
              }
            </p>
            <div className="space-x-4">
              {historyData?.sessions.length !== 0 && (
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                    setSelectedRole('all');
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Start Practicing
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            🎯 New Practice Session
          </button>
        </div>

        {/* Debug Information (remove in production) */}
        {process.env.NODE_ENV === 'development' && historyData && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total Sessions: {historyData.sessions.length}</div>
              <div>Filtered Sessions: {sortedSessions.length}</div>
              <div>User Email: {userEmail}</div>
              <div>Selected Filter: {selectedFilter}</div>
              <div>Selected Role: {selectedRole}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
