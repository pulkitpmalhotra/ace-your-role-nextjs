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
}

interface HumanFeedback {
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
  };
  analysis_type: string;
}

export default function FeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<HumanFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }

    // Load session data
    const lastSession = localStorage.getItem('lastSession');
    if (lastSession) {
      const data = JSON.parse(lastSession);
      setSessionData(data);
      
      // Trigger AI analysis
      if (data.sessionId && data.conversation.length >= 2) {
        analyzeConversation(data);
      } else {
        setLoading(false);
        setError(true);
      }
    } else {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  const analyzeConversation = async (data: SessionData) => {
    setAnalyzing(true);
    setError(false);
    
    try {
      console.log('🧠 Starting USER PERFORMANCE analysis...');
      
      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: data.conversation,
          scenario: data.scenario,
          session_id: data.sessionId
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setFeedback(result.data);
        console.log('✅ User performance analysis completed:', result.data.analysis_type);
      } else {
        console.error('❌ Analysis failed:', result.error);
        setError(true);
      }
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      setError(true);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  // Helper function to get user's practiced role
  const getUserRoleFromScenario = (scenario: any) => {
    if (!scenario) return 'professional';
    
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
    return roleMap[scenario.role] || 'professional';
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

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {analyzing ? 'Your Coach is Analyzing YOUR Performance...' : 'Loading Your Results'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'Evaluating how well YOU performed in your practice role' : 'Just a moment...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - FIXED to focus on USER performance */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <span className="text-3xl text-white">
              {error ? '💭' : feedback?.analysis_type === 'user-performance-focused' ? '🎯' : '📋'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Performance Analysis</h1>
          <p className="text-xl text-gray-600">
            Here's how you performed in your professional role practice
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>📊 Analysis Focus:</strong> This feedback analyzes YOUR performance as the {getUserRoleFromScenario(sessionData?.scenario)} 
              practicing with {sessionData?.scenario?.character_name}. The AI character's responses are not evaluated.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Feedback Temporarily Unavailable</h3>
              <p className="text-yellow-700 mb-4">
                Your session was saved successfully! Our analysis system is temporarily unavailable.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => analyzeConversation(sessionData)}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Try Again
                </button>
                <button
                  onClick={backToDashboard}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Results */}
        {feedback && !error && (
          <>
            {/* Session Overview - FIXED to focus on USER */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{getRoleEmoji(sessionData.scenario.role)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{sessionData.scenario.title}</h2>
                    <p className="text-gray-600">
                      You practiced as a <strong>{getUserRoleFromScenario(sessionData.scenario)}</strong> • 
                      Conversing with {sessionData.scenario.character_name} • {sessionData.scenario.difficulty} level
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      💡 This analysis focuses on YOUR communication skills and performance
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
                    {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Your Performance Score</p>
                  <p className="text-xs text-gray-500 mt-1">Based on your {getUserRoleFromScenario(sessionData.scenario)} skills</p>
                </div>
              </div>

              {/* Session Stats - Updated labels */}
              <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
                  <div className="text-sm text-gray-600">Conversation Exchanges</div>
                  <div className="text-xs text-gray-500">Your engagement level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sessionData.duration}m</div>
                  <div className="text-sm text-gray-600">Practice Duration</div>
                  <div className="text-xs text-gray-500">Time you invested</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{feedback.conversation_stats.user_messages}</div>
                  <div className="text-sm text-gray-600">Your Messages</div>
                  <div className="text-xs text-gray-500">Your contributions</div>
                </div>
              </div>
            </div>

            {/* Coach's Overall Impression - FIXED with user focus */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">👨‍🏫</span>
                Your Coach's Assessment of YOUR Performance
              </h3>
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>📋 Evaluation Focus:</strong> Your coach analyzed how well YOU performed as a {getUserRoleFromScenario(sessionData?.scenario)} 
                    in this practice scenario. The feedback below is specifically about your communication skills and professional approach.
                  </p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed italic">
                  "{feedback.human_feedback.overall_impression}"
                </p>
              </div>
            </div>

            {/* What Worked Well & Areas to Improve - FIXED with USER focus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Your Strengths */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  Your {getUserRoleFromScenario(sessionData?.scenario)} Strengths
                </h3>
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>🎯 What YOU did well:</strong> These are the specific {getUserRoleFromScenario(sessionData?.scenario)} skills you demonstrated effectively.
                  </p>
                </div>
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

              {/* Your Growth Areas */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Your Growth Opportunities
                </h3>
                <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    <strong>📈 Areas for YOU to develop:</strong> These are specific {getUserRoleFromScenario(sessionData?.scenario)} skills to focus on in future practice.
                  </p>
                </div>
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

            {/* Coaching Advice - FIXED with user focus */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Personal Coaching Advice for YOUR Development
              </h3>
              <div className="bg-white rounded-lg p-6 border border-purple-200">
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-purple-800 text-sm">
                    <strong>💡 Tailored for YOU:</strong> This advice is specifically designed to help you improve your {getUserRoleFromScenario(sessionData?.scenario)} skills.
                  </p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  {feedback.human_feedback.coaching_advice}
                </p>
              </div>
            </div>

            {/* Conversation Preview - FIXED with clearer labeling */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">💬</span>
                Your Practice Conversation
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-sm">
                  <strong>📝 Conversation Overview:</strong> You practiced as a <strong>{getUserRoleFromScenario(sessionData?.scenario)}</strong> 
                  while {sessionData.scenario.character_name} played the role of {sessionData.scenario.character_role}. 
                  The analysis focuses on YOUR contributions to the conversation.
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
                          `You (${getUserRoleFromScenario(sessionData.scenario)})` : 
                          `${sessionData.scenario.character_name} (${sessionData.scenario.character_role})`
                        }
                      </div>
                      {message.message}
                    </div>
                  </div>
                ))}
                {sessionData.conversation.length > 6 && (
                  <p className="text-center text-gray-500 text-sm">
                    ... and {sessionData.conversation.length - 6} more exchanges where YOU practiced your {getUserRoleFromScenario(sessionData.scenario)} skills
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

            {/* AI Analysis Badge - FIXED with user focus */}
            {feedback.analysis_type === 'user-performance-focused' && (
              <div className="text-center mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  🤖 Advanced AI Performance Analysis
                </h4>
                <p className="text-green-700 text-sm">
                  This personalized feedback was generated by analyzing YOUR specific performance as a {getUserRoleFromScenario(sessionData?.scenario)} 
                  in this conversation. Every insight is tailored to help YOU improve your professional communication skills!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
