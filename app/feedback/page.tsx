// app/feedback/page.tsx - Enhanced with Contextual Analysis

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
    objectives: string[];
    naturalEnding: boolean;
    sessionQuality: string;
  };
}

interface EnhancedFeedback {
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
    conversation_quality: number;
    completeness_score: number;
    natural_ending: boolean;
  };
  enhanced_metrics: {
    progression_analysis: {
      stages_completed: string[];
      conversation_depth: number;
      topic_consistency: number;
    };
    flow_analysis: {
      naturalProgression: number;
      conversationCohesion: number;
      engagementLevel: number;
      professionalismScore: number;
    };
    objective_analysis: {
      completion_rate: number;
      objectives_covered: string[];
      topics_discussed: string[];
    };
    performance_breakdown: {
      conversationManagement: number;
      goalAchievement: number;
      communicationSkills: number;
      professionalism: number;
    };
  };
  contextAnalysis?: any;
  analysisMetadata?: {
    hasNaturalEnding: boolean;
    conversationCompleteness: number;
    objectivesCovered: string[];
    conversationFlow: any;
  };
  analysis_type: string;
}

export default function EnhancedFeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<EnhancedFeedback | null>(null);
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
      
      // Trigger enhanced AI analysis
      if (data.sessionId && data.conversation.length >= 2) {
        analyzeEnhancedConversation(data);
      } else {
        setLoading(false);
        setError(true);
      }
    } else {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  const analyzeEnhancedConversation = async (data: SessionData) => {
    setAnalyzing(true);
    setError(false);
    
    try {
      console.log('🧠 Starting Enhanced USER PERFORMANCE analysis with full context...');
      
      const response = await fetch('/api/analyze-conversation-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: data.conversation,
          scenario: data.scenario,
          sessionId: data.sessionId,
          sessionData: {
            duration: data.duration,
            exchanges: data.exchanges,
            startTime: data.sessionContext?.startTime || Date.now() - (data.duration * 60000),
            objectives: data.sessionContext?.objectives || [],
            naturalEnding: data.sessionContext?.naturalEnding || false,
            sessionQuality: data.sessionContext?.sessionQuality || 'basic'
          }
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setFeedback(result.data);
        console.log('✅ Enhanced contextual analysis completed:', result.data.analysis_type);
      } else {
        console.error('❌ Enhanced analysis failed:', result.error);
        setError(true);
      }
    } catch (error) {
      console.error('❌ Error during enhanced analysis:', error);
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

  const getQualityIndicator = (score: number, label: string) => {
    const percentage = Math.round((score / 10) * 100);
    const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700 w-24">{label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm font-semibold text-gray-900">{score.toFixed(1)}</span>
      </div>
    );
  };

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {analyzing ? 'Enhanced AI Analysis in Progress...' : 'Loading Your Results'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'Analyzing your complete conversation context with advanced AI' : 'Just a moment...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <span className="text-3xl text-white">
              {error ? '💭' : feedback?.analysis_type?.includes('enhanced') ? '🧠' : '📋'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Enhanced Performance Analysis</h1>
          <p className="text-xl text-gray-600">
            Comprehensive AI analysis of your contextual conversation skills
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>🧠 Advanced Analysis:</strong> Our contextual AI analyzed your complete {getUserRoleFromScenario(sessionData?.scenario)} 
              conversation with {sessionData?.scenario?.character_name}, including conversation flow, objective completion, and natural progression.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Enhanced Analysis Temporarily Unavailable</h3>
              <p className="text-yellow-700 mb-4">
                Your session was saved successfully! Our advanced analysis system is temporarily unavailable.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => analyzeEnhancedConversation(sessionData)}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Try Enhanced Analysis Again
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

        {/* Enhanced Feedback Results */}
        {feedback && !error && (
          <>
            {/* Enhanced Session Overview */}
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
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-blue-600">
                        🧠 Enhanced AI Analysis: {feedback.analysis_type}
                      </span>
                      {feedback.conversation_stats.natural_ending && (
                        <span className="text-green-600">
                          ✅ Natural Conversation Ending Achieved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
                    {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Your Performance Score</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on contextual {getUserRoleFromScenario(sessionData.scenario)} analysis
                  </p>
                </div>
              </div>

              {/* Enhanced Session Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
                  <div className="text-sm text-gray-600">Conversation Exchanges</div>
                  <div className="text-xs text-gray-500">Your engagement level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sessionData.duration}m</div>
                  <div className="text-sm text-gray-600">Practice Duration</div>
                  <div className="text-xs text-gray-500">Time invested</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(feedback.conversation_stats.conversation_quality * 10)}%</div>
                  <div className="text-sm text-gray-600">Conversation Quality</div>
                  <div className="text-xs text-gray-500">AI-assessed quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(feedback.conversation_stats.completeness_score * 10)}%</div>
                  <div className="text-sm text-gray-600">Session Completeness</div>
                  <div className="text-xs text-gray-500">Objective coverage</div>
                </div>
              </div>

              {/* Enhanced Performance Breakdown */}
              {feedback.enhanced_metrics && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    🎯 Detailed Performance Breakdown
                  </h3>
                  <div className="space-y-3">
                    {getQualityIndicator(feedback.enhanced_metrics.performance_breakdown.conversationManagement, 'Management')}
                    {getQualityIndicator(feedback.enhanced_metrics.performance_breakdown.communicationSkills, 'Communication')}
                    {getQualityIndicator(feedback.enhanced_metrics.performance_breakdown.professionalism, 'Professionalism')}
                    {getQualityIndicator(feedback.enhanced_metrics.performance_breakdown.goalAchievement * 10, 'Goal Achievement')}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Coach's Assessment */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🧠</span>
                AI Coach's Contextual Assessment of YOUR Performance
              </h3>
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>🎯 Enhanced Analysis:</strong> Your AI coach analyzed how well YOU performed as a {getUserRoleFromScenario(sessionData?.scenario)} 
                    in this {feedback.conversation_stats.natural_ending ? 'complete conversation with natural ending' : 'practice conversation'}.
                    {feedback.enhanced_metrics && (
                      <span> The analysis covered {feedback.enhanced_metrics.progression_analysis.stages_completed.length} conversation stages 
                      and {feedback.enhanced_metrics.objective_analysis.objectives_covered.length} professional objectives.</span>
                    )}
                  </p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed italic">
                  "{feedback.human_feedback.overall_impression}"
                </p>
              </div>
            </div>

            {/* Enhanced Strengths & Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Your Contextual Strengths */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  Your {getUserRoleFromScenario(sessionData?.scenario)} Strengths
                </h3>
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>🎯 What YOU did well:</strong> These strengths were identified through contextual analysis 
                    of your complete {getUserRoleFromScenario(sessionData?.scenario)} conversation.
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

                {/* Additional Context from Enhanced Metrics */}
                {feedback.enhanced_metrics && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">📈 Contextual Insights</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>• Conversation depth: {feedback.enhanced_metrics.progression_analysis.conversation_depth}/10</div>
                      <div>• Stages completed: {feedback.enhanced_metrics.progression_analysis.stages_completed.join(', ')}</div>
                      <div>• Topics covered: {feedback.enhanced_metrics.objective_analysis.topics_discussed.slice(0, 3).join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Your Growth Opportunities */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Your Growth Opportunities
                </h3>
                <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    <strong>📈 Areas for YOU to develop:</strong> These opportunities were identified through 
                    analysis of your {getUserRoleFromScenario(sessionData?.scenario)} conversation patterns and objective completion.
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

                {/* Context from Enhanced Metrics */}
                {feedback.enhanced_metrics && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">🎯 Focus Areas</h4>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div>• Objective completion: {Math.round(feedback.enhanced_metrics.objective_analysis.completion_rate * 100)}%</div>
                      <div>• Flow quality: {feedback.enhanced_metrics.flow_analysis.naturalProgression}/10</div>
                      {!feedback.conversation_stats.natural_ending && (
                        <div>• Work on natural conversation conclusions</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Coaching Advice */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Personalized Coaching for YOUR {getUserRoleFromScenario(sessionData?.scenario)} Development
              </h3>
              <div className="bg-white rounded-lg p-6 border border-purple-200">
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-purple-800 text-sm">
                    <strong>💡 Tailored Guidance:</strong> This advice is specifically designed to help you improve your 
                    {getUserRoleFromScenario(sessionData?.scenario)} skills based on your complete conversation analysis.
                    {feedback.enhanced_metrics && (
                      <span> Focus areas identified from {feedback.enhanced_metrics.progression_analysis.stages_completed.length} conversation stages.</span>
                    )}
                  </p>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">
                  {feedback.human_feedback.coaching_advice}
                </p>

                {/* Enhanced Next Steps */}
                {feedback.enhanced_metrics && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">🎯 Next Session Focus</h4>
                      <div className="text-sm text-purple-700">
                        {feedback.conversation_stats.conversation_quality >= 8 ? (
                          <>Try advanced scenarios or different roles to challenge yourself further.</>
                        ) : feedback.enhanced_metrics.objective_analysis.completion_rate < 0.5 ? (
                          <>Focus on systematic objective completion and deeper engagement.</>
                        ) : (
                          <>Work on extending conversations naturally and improving flow.</>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">📚 Skill Development</h4>
                      <div className="text-sm text-purple-700">
                        Practice {feedback.enhanced_metrics.flow_analysis.engagementLevel < 7 ? 
                          'active questioning and listening techniques' : 
                          'advanced conversation management skills'}.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Conversation Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📊</span>
                Conversation Flow Analysis
              </h3>
              
              {feedback.enhanced_metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {feedback.enhanced_metrics.progression_analysis.stages_completed.length}
                    </div>
                    <div className="text-sm font-medium text-blue-800">Conversation Stages</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {feedback.enhanced_metrics.progression_analysis.stages_completed.join(' → ')}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {feedback.enhanced_metrics.objective_analysis.objectives_covered.length}
                    </div>
                    <div className="text-sm font-medium text-green-800">Objectives Covered</div>
                    <div className="text-xs text-green-600 mt-1">
                      {Math.round(feedback.enhanced_metrics.objective_analysis.completion_rate * 100)}% completion rate
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {feedback.enhanced_metrics.flow_analysis.engagementLevel.toFixed(1)}
                    </div>
                    <div className="text-sm font-medium text-purple-800">Engagement Level</div>
                    <div className="text-xs text-purple-600 mt-1">Out of 10</div>
                  </div>
                </div>
              )}
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-sm">
                  <strong>📝 Conversation Summary:</strong> You practiced as a <strong>{getUserRoleFromScenario(sessionData?.scenario)}</strong> 
                  while {sessionData.scenario.character_name} played the role of {sessionData.scenario.character_role}. 
                  {feedback.conversation_stats.natural_ending ? 
                    ' The conversation reached a natural, professional conclusion.' : 
                    ' The analysis focuses on your contributions to the conversation.'
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
                    ... and {sessionData.conversation.length - 6} more exchanges in your {getUserRoleFromScenario(sessionData.scenario)} practice
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

            {/* Enhanced AI Analysis Badge */}
            {feedback.analysis_type?.includes('enhanced') && (
              <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="text-xl font-semibold text-blue-800 mb-3">
                  🧠 Advanced Contextual AI Analysis Complete
                </h4>
                <p className="text-blue-700 text-base leading-relaxed">
                  This comprehensive feedback was generated by analyzing YOUR complete performance as a {getUserRoleFromScenario(sessionData?.scenario)} 
                  in this conversation. Our contextual AI considered conversation flow, objective completion, natural progression, 
                  and {feedback.enhanced_metrics?.progression_analysis.stages_completed.length} conversation stages to provide 
                  personalized insights for your professional development!
                </p>
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-blue-600">
                  {feedback.conversation_stats.natural_ending && (
                    <span className="bg-green-100 px-3 py-1 rounded-full">✅ Natural Ending Detected</span>
                  )}
                  <span className="bg-blue-100 px-3 py-1 rounded-full">
                    🎯 {Math.round(feedback.conversation_stats.completeness_score * 10)}% Session Completeness
                  </span>
                  {feedback.enhanced_metrics && (
                    <span className="bg-purple-100 px-3 py-1 rounded-full">
                      📊 {feedback.enhanced_metrics.objective_analysis.objectives_covered.length} Objectives Analyzed
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
