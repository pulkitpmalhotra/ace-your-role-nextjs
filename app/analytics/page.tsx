'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProgressData {
  role: string;
  total_sessions: number;
  total_minutes: number;
  average_score: number;
  best_score: number;
  last_session_date: string;
}

interface SessionData {
  id: string;
  start_time: string;
  duration_minutes: number;
  overall_score: number;
  session_status: string;
  scenarios: {
    title: string;
    character_name: string;
    role: string;
    difficulty: string;
  };
}

interface AnalyticsData {
  progress: ProgressData[];
  summary: {
    total_roles: number;
    total_sessions: number;
    total_minutes: number;
    overall_average_score: number;
    best_role: ProgressData | null;
    days_active: number;
    streak_days: number;
  };
  recent_sessions: SessionData[];
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }
    setUserEmail(email);
    loadAnalytics();
  }, [router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/progress?user_email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    if (score >= 3.5) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    if (score >= 2.5) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  };

  const getProgressWidth = (score: number) => {
    return `${(score / 5) * 100}%`;
  };

  const getRoleEmoji = (role: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
   'product-manager': '📱',
  'project-manager': '📋', 
  'engineer': '👩‍💻',
  'technical-program-manager': '🔧',
  'strategy-lead': '🎯',
  'manager': '👥',
      'leader': '👥'
    };
    return emojiMap[role] || '💬';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getImprovementTrend = (recent: SessionData[], role: string) => {
    const roleSessions = recent
      .filter(s => s.scenarios.role === role && s.overall_score)
      .slice(0, 5)
      .reverse();
    
    if (roleSessions.length < 2) return null;
    
    const latest = roleSessions[roleSessions.length - 1].overall_score;
    const previous = roleSessions[roleSessions.length - 2].overall_score;
    const change = latest - previous;
    
    return {
      trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
      change: Math.abs(change),
      sessions: roleSessions.length
    };
  };

  const getSkillLevel = (averageScore: number) => {
    if (averageScore >= 4.5) return { level: 'Expert', color: 'text-purple-600' };
    if (averageScore >= 4.0) return { level: 'Advanced', color: 'text-green-600' };
    if (averageScore >= 3.5) return { level: 'Proficient', color: 'text-blue-600' };
    if (averageScore >= 3.0) return { level: 'Developing', color: 'text-yellow-600' };
    return { level: 'Beginner', color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Analytics</h2>
          <p className="text-gray-600">Analyzing your progress data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600 mb-6">Complete some practice sessions to see your progress!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            Start Practicing
          </button>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Progress Analytics</h1>
            <p className="text-xl text-gray-600">Track your communication skill development</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Sessions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🎯</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{analyticsData.summary.total_sessions}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Across {analyticsData.summary.total_roles} roles
            </div>
          </div>

          {/* Practice Time */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⏱️</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{analyticsData.summary.total_minutes}</div>
                <div className="text-sm text-gray-600">Minutes Practiced</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(analyticsData.summary.total_minutes / 60)}+ hours of training
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📈</div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(analyticsData.summary.overall_average_score).text}`}>
                  {analyticsData.summary.overall_average_score ? analyticsData.summary.overall_average_score.toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {getSkillLevel(analyticsData.summary.overall_average_score).level} level
            </div>
          </div>

          {/* Practice Streak */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🔥</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">{analyticsData.summary.streak_days}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Keep practicing daily!
            </div>
          </div>
        </div>

        {/* Role Progress */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-3">📊</span>
            Skill Role Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyticsData.progress.map((role) => {
              const skillLevel = getSkillLevel(role.average_score);
              const trend = getImprovementTrend(analyticsData.recent_sessions, role.role);
              
              return (
                <div key={role.role} className="border border-gray-200 rounded-xl p-6">
                  
                  {/* Role Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getRoleEmoji(role.role)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">{role.role}</h3>
                        <p className={`text-sm font-medium ${skillLevel.color}`}>{skillLevel.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(role.average_score).text}`}>
                        {role.average_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">/ 5.0</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{Math.round((role.average_score / 5) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          role.average_score >= 4.5 ? 'bg-green-500' :
                          role.average_score >= 3.5 ? 'bg-blue-500' :
                          role.average_score >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: getProgressWidth(role.average_score) }}
                      ></div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{role.total_sessions}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{role.total_minutes}m</div>
                      <div className="text-xs text-gray-600">Time</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${getScoreColor(role.best_score).text}`}>
                        {role.best_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">Best</div>
                    </div>
                  </div>

                  {/* Improvement Trend */}
                  {trend && (
                    <div className={`text-sm p-2 rounded-lg ${
                      trend.trend === 'improving' ? 'bg-green-50 text-green-800' :
                      trend.trend === 'declining' ? 'bg-red-50 text-red-800' :
                      'bg-gray-50 text-gray-800'
                    }`}>
                      {trend.trend === 'improving' && '📈 Improving'}
                      {trend.trend === 'declining' && '📉 Focus needed'}
                      {trend.trend === 'stable' && '➡️ Consistent'}
                      <span className="ml-1">
                        ({trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)} in last {trend.sessions} sessions)
                      </span>
                    </div>
                  )}

                  {/* Last Practice */}
                  <div className="text-xs text-gray-500 mt-3">
                    Last practiced: {formatDate(role.last_session_date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-3">📅</span>
            Recent Training Sessions
          </h2>
          
          {analyticsData.recent_sessions.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.recent_sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    
                    {/* Session Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getRoleEmoji(session.scenarios.role)}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.scenarios.title}</h4>
                        <p className="text-sm text-gray-600">
                          with {session.scenarios.character_name} • {session.scenarios.difficulty}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.start_time)} • {session.duration_minutes} minutes
                        </p>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                      session.overall_score ? getScoreColor(session.overall_score).bg + ' ' + 
                      getScoreColor(session.overall_score).text + ' ' + 
                      getScoreColor(session.overall_score).border + ' border' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {session.overall_score ? session.overall_score.toFixed(1) : 'N/A'}/5.0
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 mb-6">No completed sessions yet</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
              >
                Start Your First Session
              </button>
            </div>
          )}
        </div>

        {/* Insights and Recommendations */}
        {analyticsData.summary.total_sessions > 0 && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
              <span className="text-xl mr-3">💡</span>
              Insights & Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Performance Insights */}
              <div className="bg-white rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Performance Insights</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    You've practiced {analyticsData.summary.total_sessions} sessions across {analyticsData.summary.total_roles} professional roles
                  </li>
                  {analyticsData.summary.best_role && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Your strongest area is <strong>{analyticsData.summary.best_role.role}</strong> with {analyticsData.summary.best_role.best_score.toFixed(1)}/5.0
                    </li>
                  )}
                  {analyticsData.summary.streak_days > 0 && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Great job maintaining a {analyticsData.summary.streak_days}-day practice streak!
                    </li>
                  )}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="bg-white rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Recommended Next Steps</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Practice daily to maintain your momentum
                  </li>
                  {analyticsData.summary.overall_average_score < 3.5 && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Focus on fundamental conversation skills with beginner scenarios
                    </li>
                  )}
                  {analyticsData.summary.overall_average_score >= 4 && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Try advanced scenarios to challenge yourself further
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Explore new roles to build diverse communication skills
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
