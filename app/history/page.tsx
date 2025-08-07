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
  scenarios: {
    title: string;
    character_name: string;
    character_role: string;
    role: string;
    difficulty: string;
  };
  conversation_metadata?: {
    natural_ending?: boolean;
    session_quality?: string;
    total_exchanges?: number;
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
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  
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
      
      if (!email || !sessionToken || authProvider !== 'google') {
        router.push('/');
        return;
      }

      setUserEmail(email);
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
      // Load user sessions
      const sessionsResponse = await fetch(`/api/sessions?user_email=${encodeURIComponent(email)}`);
      
      if (!sessionsResponse.ok) {
        throw new Error('Failed to load session history');
      }

      const sessionsData = await sessionsResponse.json();
      
      if (!sessionsData.success) {
        throw new Error(sessionsData.error || 'Failed to load sessions');
      }

      const sessions = sessionsData.data || [];
      
      // Calculate summary statistics
      const completedSessions = sessions.filter((s: Session) => s.session_status === 'completed');
      const totalMinutes = completedSessions.reduce((sum: number, s: Session) => sum + (s.duration_minutes || 0), 0);
      const averageScore = completedSessions.length > 0 
        ? completedSessions.reduce((sum: number, s: Session) => sum + (s.overall_score || 0), 0) / completedSessions.length
        : 0;
      const bestScore = Math.max(...completedSessions.map((s: Session) => s.overall_score || 0), 0);
      
      // Fix TypeScript Set iteration issue with proper typing
      const rolesSet = new Set<string>();
      sessions.forEach((s: Session) => {
        if (s.scenarios?.role) {
          rolesSet.add(s.scenarios.role);
        }
      });
      const rolesPracticed = Array.from(rolesSet);

      const summary = {
        total_sessions: sessions.length,
        total_minutes: totalMinutes,
        average_score: averageScore,
        best_score: bestScore,
        completed_sessions: completedSessions.length,
        roles_practiced: rolesPracticed
      };

      setHistoryData({ sessions, summary });
      console.log(`✅ Loaded ${sessions.length} sessions for user`);
      
    } catch (error) {
      console.error('Error loading history data:', error);
      setError('Failed to load session history');
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
    // Store session data for feedback page
    const sessionData = {
      scenario: session.scenarios,
      sessionId: session.id,
      duration: session.duration_minutes || 0,
      exchanges: session.conversation_metadata?.total_exchanges || 0,
      userEmail: userEmail,
      sessionContext: {
        startTime: new Date(session.start_time).getTime(),
        naturalEnding: session.conversation_metadata?.natural_ending || false,
        sessionQuality: session.conversation_metadata?.session_quality || 'basic'
      }
    };
    
    localStorage.setItem('viewSessionData', JSON.stringify(sessionData));
    router.push(`/feedback/view/${session.id}`);
  };

  const downloadFeedbackPDF = async (session: Session) => {
    setDownloadingPdf(session.id);
    
    try {
      // Generate feedback data
      const sessionData = {
        scenario: session.scenarios,
        sessionId: session.id,
        duration: session.duration_minutes || 0,
        score: session.overall_score || 0,
        date: new Date(session.start_time).toLocaleDateString(),
        naturalEnding: session.conversation_metadata?.natural_ending || false,
        exchanges: session.conversation_metadata?.total_exchanges || 0
      };

      // Create PDF content (you'll need to implement PDF generation)
      const pdfContent = generatePDFContent(sessionData);
      
      // Create and download file
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-${session.scenarios?.title.replace(/[^a-zA-Z0-9]/g, '-')}-${session.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const generatePDFContent = (sessionData: any): string => {
    // This is a simplified PDF generation - you'd want to use a proper PDF library
    return `
    Session Feedback Report
    
    Scenario: ${sessionData.scenario.title}
    Character: ${sessionData.scenario.character_name}
    Role Practiced: ${sessionData.scenario.role}
    Date: ${sessionData.date}
    Duration: ${sessionData.duration} minutes
    Score: ${sessionData.score}/5.0
    Exchanges: ${sessionData.exchanges}
    Natural Ending: ${sessionData.naturalEnding ? 'Yes' : 'No'}
    
    Generated by Ace Your Role - AI-Powered Professional Training
    `;
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
              onClick={() => window.location.reload()}
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
            <p className="text-xl text-gray-600">Review your practice sessions and feedback</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🎯</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{historyData?.summary.total_sessions}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {historyData?.summary.completed_sessions} completed
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⏱️</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{historyData?.summary.total_minutes}</div>
                <div className="text-sm text-gray-600">Minutes Practiced</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((historyData?.summary.total_minutes || 0) / 60)}+ hours total
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📈</div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(historyData?.summary.average_score || 0)}`}>
                  {historyData?.summary.average_score ? historyData.summary.average_score.toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Best: {historyData?.summary.best_score ? historyData.summary.best_score.toFixed(1) : '0.0'}/5.0
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🎭</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{historyData?.summary.roles_practiced.length}</div>
                <div className="text-sm text-gray-600">Roles Practiced</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Professional variety
            </div>
          </div>
        </div>

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
                    {roleEmojis[role]} {role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {sortedSessions.length} of {historyData?.sessions.length} sessions
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
                      {roleEmojis[session.scenarios?.role] || '💬'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {session.scenarios?.title || 'Unknown Scenario'}
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

                    {/* Action Buttons */}
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
                        📊 View Feedback
                      </button>
                      
                      <button
                        onClick={() => downloadFeedbackPDF(session)}
                        disabled={session.session_status !== 'completed' || downloadingPdf === session.id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          session.session_status === 'completed' && downloadingPdf !== session.id
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {downloadingPdf === session.id ? (
                          <>
                            <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          '📄 Download PDF'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {session.conversation_metadata?.total_exchanges || 0}
                    </div>
                    <div className="text-xs text-gray-600">Exchanges</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {session.scenarios?.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h3>
            <p className="text-gray-600 mb-6">
              {selectedFilter !== 'all' || selectedRole !== 'all' 
                ? 'No sessions match your current filters. Try adjusting your search criteria.'
                : 'You haven\'t completed any practice sessions yet. Start practicing to see your history here!'
              }
            </p>
            <div className="space-x-4">
              {(selectedFilter !== 'all' || selectedRole !== 'all') && (
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
            onClick={() => router.push('/analytics')}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            📊 Detailed Analytics
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            🎯 New Practice Session
          </button>
        </div>
      </div>
    </div>
  );
}
