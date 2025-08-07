// app/feedback/page.tsx - Fixed with Better Error Handling
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SessionData {
  scenario: {
    id: string;
    title: string;
    character_name: string;
    character_role: string;
    difficulty: string;
    role: string;
  };
  conversation: Array<{
    speaker: 'user' | 'ai';
    message: string;
    timestamp: number;
  }>;
  duration: number;
  exchanges: number;
  userEmail: string;
  sessionId: string;
  sessionContext?: {
    startTime: number;
    naturalEnding: boolean;
    sessionQuality: string;
  };
}

interface FeedbackData {
  overall_score: number;
  human_feedback: {
    overall_impression: string;
    what_worked_well: string[];
    areas_to_improve: string[];
    coaching_advice: string;
  };
  conversation_stats: {
    total_exchanges: number;
    user_messages: number;
    character_name: string;
    scenario_title: string;
    role_type: string;
    user_role_practiced?: string;
    session_duration: number;
    conversation_quality?: number;
    completeness_score?: number;
    natural_ending?: boolean;
  };
  analysis_type?: string;
}

export default function FixedFeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    initializeFeedback();
  }, [router]);

  const initializeFeedback = async () => {
    try {
      // Check authentication
      const email = localStorage.getItem('userEmail');
      if (!email) {
        console.log('❌ No user email found, redirecting to login');
        router.push('/');
        return;
      }

      // Load session data
      const lastSession = localStorage.getItem('lastSession');
      if (!lastSession) {
        console.log('❌ No session data found, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      let sessionData: SessionData;
      try {
        sessionData = JSON.parse(lastSession);
      } catch (parseError) {
        console.error('❌ Failed to parse session data:', parseError);
        setError('Invalid session data. Please try a new session.');
        setLoading(false);
        return;
      }

      // Validate session data
      if (!sessionData.scenario || !sessionData.conversation || sessionData.conversation.length < 2) {
        console.error('❌ Invalid session data structure');
        setError('Incomplete session data. Please try a new session.');
        setLoading(false);
        return;
      }

      console.log('✅ Session data loaded:', {
        scenario: sessionData.scenario.title,
        exchanges: sessionData.exchanges,
        duration: sessionData.duration
      });

      setSessionData(sessionData);
      
      // Generate feedback
      await generateFeedback(sessionData);
      
    } catch (err) {
      console.error('❌ Feedback initialization error:', err);
      setError('Failed to load session data. Please try a new session.');
      setLoading(false);
    }
  };

  const generateFeedback = async (data: SessionData) => {
    setAnalyzing(true);
    setError('');
    
    try {
      console.log('🧠 Generating feedback for session...');
      
      // Try enhanced analysis first
      const enhancedFeedback = await tryEnhancedAnalysis(data);
      if (enhancedFeedback) {
        setFeedback(enhancedFeedback);
        setAnalyzing(false);
        setLoading(false);
        return;
      }

      // Fallback to basic analysis
      console.log('📊 Using fallback analysis...');
      const fallbackFeedback = generateFallbackFeedback(data);
      setFeedback(fallbackFeedback);
      
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      
      // Use local fallback
      const fallbackFeedback = generateFallbackFeedback(data);
      setFeedback(fallbackFeedback);
      
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const tryEnhancedAnalysis = async (data: SessionData): Promise<FeedbackData | null> => {
    try {
      console.log('🤖 Attempting enhanced AI analysis...');
      
      const response = await fetch('/api/analyze-conversation-enhanced', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          conversation: data.conversation,
          scenario: data.scenario,
          sessionId: data.sessionId,
          sessionData: {
            duration: data.duration,
            exchanges: data.exchanges,
            startTime: data.sessionContext?.startTime || Date.now() - (data.duration * 60000),
            naturalEnding: data.sessionContext?.naturalEnding || false,
            sessionQuality: data.sessionContext?.sessionQuality || 'basic'
          }
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ Enhanced analysis failed: ${response.status}`);
        return null;
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.warn('⚠️ Enhanced analysis returned no data');
        return null;
      }
      
      console.log('✅ Enhanced analysis completed');
      return result.data;
      
    } catch (error) {
      console.warn('⚠️ Enhanced analysis error:', error);
      return null;
    }
  };

  const generateFallbackFeedback = (data: SessionData): FeedbackData => {
    console.log('📊 Generating fallback feedback...');
    
    const userRole = getUserRole(data.scenario.role);
    const exchanges = data.exchanges;
    const duration = data.duration;
    
    // Calculate score based on engagement
    let score = 2.5; // Base score
    score += (exchanges >= 2 ? 0.5 : 0);
    score += (exchanges >= 4 ? 0.5 : 0);
    score += (exchanges >= 6 ? 0.5 : 0);
    score += (exchanges >= 8 ? 0.5 : 0);
    score += (duration >= 3 ? 0.3 : 0);
    score += (duration >= 7 ? 0.5 : 0);
    score += (data.sessionContext?.naturalEnding ? 0.5 : 0);
    score = Math.min(5.0, score);

    return {
      overall_score: score,
      human_feedback: {
        overall_impression: `You completed a ${userRole} practice session with ${data.scenario.character_name}. ${data.sessionContext?.naturalEnding ? 'The conversation reached a natural conclusion' : 'You engaged in meaningful conversation'} with ${exchanges} exchanges over ${duration} minutes. Your performance was ${exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'very good' : exchanges >= 4 ? 'good' : 'developing'}.`,
        what_worked_well: [
          `You actively participated in the ${userRole} role throughout the conversation`,
          exchanges >= 6 ? `You sustained the conversation well with ${exchanges} exchanges` : 'You engaged professionally with the AI character',
          duration >= 5 ? `You invested ${duration} minutes in meaningful practice` : 'You committed time to developing your communication skills',
          data.sessionContext?.naturalEnding ? 'You successfully guided the conversation to a natural, professional conclusion' : 'You maintained focus on the scenario objectives'
        ].slice(0, 3),
        areas_to_improve: [
          exchanges < 6 ? `Try to extend conversations longer for more comprehensive ${userRole} practice` : 'Continue building on your conversation management skills',
          !data.sessionContext?.naturalEnding ? 'Practice bringing conversations to natural, professional conclusions' : 'Try to explore topics in even greater depth in future sessions',
          exchanges < 4 ? 'Work on building conversation confidence and engagement' : 'Focus on systematically covering key professional objectives',
          'Continue developing your communication skills through regular practice'
        ].slice(0, 3),
        coaching_advice: `Your ${userRole} practice session ${data.sessionContext?.naturalEnding ? 'demonstrated good conversation management with a natural ending' : 'covered important ground and showed professional engagement'}. ${exchanges >= 8 ? 'Excellent depth and engagement - continue practicing with similar commitment to build advanced skills.' : exchanges >= 6 ? 'Good progress shown - focus on extending conversations naturally and covering more objectives systematically.' : exchanges >= 4 ? 'Solid foundation demonstrated - continue practicing to build conversation confidence and depth.' : 'Keep practicing regularly to build conversation skills and professional confidence.'} Focus on ${exchanges >= 6 ? 'advanced conversation techniques and objective mastery' : 'building longer, more comprehensive conversations'} in your next sessions.`
      },
      conversation_stats: {
        total_exchanges: exchanges,
        user_messages: data.conversation.filter(msg => msg.speaker === 'user').length,
        character_name: data.scenario.character_name,
        scenario_title: data.scenario.title,
        role_type: data.scenario.role,
        user_role_practiced: userRole,
        session_duration: duration,
        conversation_quality: exchanges >= 8 ? 8.5 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 6.0 : 5.0,
        completeness_score: exchanges >= 8 ? 8.0 : exchanges >= 6 ? 6.5 : exchanges >= 4 ? 5.0 : 4.0,
        natural_ending: data.sessionContext?.naturalEnding || false
      },
      analysis_type: 'fallback-analysis'
    };
  };

  const getUserRole = (scenarioRole: string): string => {
    const roleMap: Record<string, string> = {
      'sales': 'salesperson',
      'project-manager': 'project manager',
      'product-manager': 'product manager',
      'leader': 'leader',
      'manager': 'manager',
      'strategy-lead': 'strategy lead',
      'support-agent': 'customer service representative',
      'data-analyst': 'data analyst',
      'engineer': 'engineer',
      'nurse': 'healthcare provider',
      'doctor': 'healthcare provider'
    };
    return roleMap[scenarioRole] || 'professional';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 4.5) return '🌟';
    if (score >= 3.5) return '👍';
    if (score >= 2.5) return '👌';
    return '💪';
  };

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

  const backToDashboard = () => {
    localStorage.removeItem('lastSession');
    router.push('/dashboard');
  };

  const startNewSession = () => {
    localStorage.removeItem('lastSession');
    router.push('/dashboard');
  };

  // Loading state
  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {analyzing ? 'Analyzing Your Performance...' : 'Loading Your Results'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'AI is analyzing your conversation for detailed feedback' : 'Just a moment...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Feedback Error</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => generateFeedback(sessionData)}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={backToDashboard}
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
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <span className="text-3xl text-white">
              {feedback?.analysis_type?.includes('enhanced') ? '🧠' : '📋'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Performance Analysis</h1>
          <p className="text-xl text-gray-600">
            {feedback?.analysis_type?.includes('enhanced') ? 'Enhanced AI' : 'Comprehensive'} analysis of your conversation skills
          </p>
        </div>

        {feedback && (
          <>
            {/* Session Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{getRoleEmoji(sessionData.scenario.role)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{sessionData.scenario.title}</h2>
                    <p className="text-gray-600">
                      You practiced as a <strong>{getUserRole(sessionData.scenario.role)}</strong> • 
                      Conversing with {sessionData.scenario.character_name} • {sessionData.scenario.difficulty} level
                    </p>
                    {feedback.analysis_type && (
                      <div className="mt-2 text-sm text-blue-600">
                        📊 Analysis Type: {feedback.analysis_type}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
                    {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Your Performance Score</p>
                  <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
                  <div className="text-sm text-gray-600">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sessionData.duration}m</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {feedback.conversation_stats.conversation_quality ? Math.round(feedback.conversation_stats.conversation_quality * 10) : 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-600">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {feedback.conversation_stats.natural_ending ? '✅' : '⏸️'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {feedback.conversation_stats.natural_ending ? 'Natural End' : 'Stopped'}
                  </div>
                </div>
              </div>
            </div>

            {/* Coach's Assessment */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Coach's Assessment
              </h3>
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <p className="text-gray-800 text-lg leading-relaxed italic">
                  "{feedback.human_feedback.overall_impression}"
                </p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Strengths */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  What Worked Well
                </h3>
                <div className="space-y-4">
                  {feedback.human_feedback.what_worked_well.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Areas to Improve
                </h3>
                <div className="space-y-4">
                  {feedback.human_feedback.areas_to_improve.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 text-sm">→</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coaching Advice */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Personalized Coaching Advice
              </h3>
              <div className="bg-white rounded-lg p-6 border border-purple-200">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {feedback.human_feedback.coaching_advice}
                </p>
              </div>
            </div>

            {/* Conversation Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📝</span>
                Conversation Summary
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-sm">
                  <strong>Session Overview:</strong> You practiced as a <strong>{getUserRole(sessionData.scenario.role)}</strong> 
                  while {sessionData.scenario.character_name} played the role of {sessionData.scenario.character_role}. 
                  {feedback.conversation_stats.natural_ending ? 
                    ' The conversation reached a natural, professional conclusion.' : 
                    ' The session focused on your communication skills development.'
                  }
                </p>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                {sessionData.conversation.slice(0, 6).map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                        message.speaker === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {message.speaker === 'user' ? 
                          `You (${getUserRole(sessionData.scenario.role)})` : 
                          `${sessionData.scenario.character_name} (${sessionData.scenario.character_role})`
                        }
                      </div>
                      {message.message}
                    </div>
                  </div>
                ))}
                {sessionData.conversation.length > 6 && (
                  <p className="text-center text-gray-500 text-sm">
                    ... and {sessionData.conversation.length - 6} more exchanges in your practice session
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startNewSession}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                🎯 Practice Another Scenario
              </button>
              <button
                onClick={backToDashboard}
                className="bg-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                📊 View Dashboard
              </button>
            </div>

            {/* Analysis Badge */}
            {feedback.analysis_type && (
              <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">
                  {feedback.analysis_type.includes('enhanced') ? '🧠 Enhanced AI Analysis Complete' : '📊 Analysis Complete'}
                </h4>
                <p className="text-blue-700 text-base leading-relaxed">
                  This feedback was generated by analyzing your complete performance as a {getUserRole(sessionData.scenario.role)} 
                  in this conversation. The analysis considered conversation flow, objective completion, and professional communication skills 
                  to provide personalized insights for your development.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-blue-600">
                  {feedback.conversation_stats.natural_ending && (
                    <span className="bg-green-100 px-3 py-1 rounded-full">✅ Natural Ending</span>
                  )}
                  <span className="bg-blue-100 px-3 py-1 rounded-full">
                    🎯 {Math.round((feedback.conversation_stats.completeness_score || 5) * 10)}% Completeness
                  </span>
                  <span className="bg-purple-100 px-3 py-1 rounded-full">
                    📊 {feedback.conversation_stats.total_exchanges} Exchanges Analyzed
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
