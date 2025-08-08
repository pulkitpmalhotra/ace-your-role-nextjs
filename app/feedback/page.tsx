// app/feedback/page.tsx - Focused Speech Feedback
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

interface FocusedFeedbackData {
  overall_score: number;
  speech_analysis: {
    filler_words: {
      count: number;
      examples: string[];
      impact: string;
    };
    speaking_speed: {
      speed: string;
      assessment: string;
      recommendation: string;
    };
    inclusive_language: {
      issues: string;
      examples: string[];
      suggestions: string;
    };
    weak_words: {
      weak_words: string[];
      strong_alternatives: string[];
      professional_impact: string;
    };
    repetition: {
      repeated_words: string[];
      frequency: string;
      impact: string;
    };
    talk_time: {
      user_speaking_minutes: number;
      percentage: number;
      balance_assessment: string;
      recommendation: string;
    };
  };
  objectives_analysis: {
    completed: string[];
    missed: string[];
    evidence: string;
    next_steps: string;
  };
  conversation_stats: {
    total_exchanges: number;
    user_messages: number;
    character_name: string;
    scenario_title: string;
    role_type: string;
    user_role_practiced: string;
    session_duration: number;
    user_speaking_time: number;
    natural_ending: boolean;
  };
  analysis_type: string;
}

export default function FocusedFeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<FocusedFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'speech' | 'objectives'>('overview');
  
  const router = useRouter();

  useEffect(() => {
    initializeFeedback();
  }, [router]);

  const initializeFeedback = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        router.push('/');
        return;
      }

      const lastSession = localStorage.getItem('lastSession');
      if (!lastSession) {
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

      if (!sessionData.scenario || !sessionData.conversation || sessionData.conversation.length < 2) {
        setError('Incomplete session data. Please try a new session.');
        setLoading(false);
        return;
      }

      setSessionData(sessionData);
      await generateFocusedFeedback(sessionData);
      
    } catch (err) {
      console.error('❌ Feedback initialization error:', err);
      setError('Failed to load session data. Please try a new session.');
      setLoading(false);
    }
  };

  const generateFocusedFeedback = async (data: SessionData) => {
    setAnalyzing(true);
    setError('');
    
    try {
      console.log('🧠 Generating focused speech analysis...');
      
      const response = await fetch('/api/analyze-conversation', {
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
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('No analysis data received');
      }
      
      setFeedback(result.data);
      console.log('✅ Focused speech analysis completed');
      
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      setError('Analysis failed. Please try again.');
      
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
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
      'support-agent': '🎧',
      'data-analyst': '📊',
      'engineer': '👩‍💻',
      'nurse': '👩‍⚕️',
      'doctor': '🩺'
    };
    return emojiMap[role] || '💬';
  };

  const getImpactColor = (impact: string) => {
    if (impact.toLowerCase().includes('high')) {
      return 'text-red-700 bg-red-50 border-red-200';
    }
    if (impact.toLowerCase().includes('moderate')) {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
    return 'text-green-700 bg-green-50 border-green-200';
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
            {analyzing ? 'Analyzing Your Speech...' : 'Loading Your Results'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'Gemini AI is analyzing your communication patterns' : 'Just a moment...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Analysis Error</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => generateFocusedFeedback(sessionData)}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Try Analysis Again
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

  // No feedback check
  if (!feedback) {
    return null;
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <span className="text-3xl text-white">🎤</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Speech Analysis Report</h1>
          <p className="text-xl text-gray-600">
            AI-powered analysis of your communication patterns
          </p>
        </div>

        {/* Session Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getRoleEmoji(sessionData.scenario.role)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{sessionData.scenario.title}</h2>
                <p className="text-gray-600">
                  You practiced as a <strong>{feedback.conversation_stats.user_role_practiced}</strong> • 
                  Conversing with {sessionData.scenario.character_name} • {sessionData.scenario.difficulty} level
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
                {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">Overall Score</p>
              <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
              <div className="text-sm text-gray-600">Exchanges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{feedback.conversation_stats.session_duration}m</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{feedback.speech_analysis.talk_time.user_speaking_minutes}m</div>
              <div className="text-sm text-gray-600">Your Talk Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{feedback.speech_analysis.talk_time.percentage}%</div>
              <div className="text-sm text-gray-600">Talk Percentage</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'speech', label: '🎤 Speech Analysis' },
            { id: 'objectives', label: '🎯 Objectives' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Key Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Speech Quality</h4>
                  <p className="text-blue-800 text-sm">
                    {feedback.speech_analysis.filler_words.count} filler words detected • {feedback.speech_analysis.speaking_speed.assessment}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Talk Balance</h4>
                  <p className="text-blue-800 text-sm">
                    {feedback.speech_analysis.talk_time.balance_assessment}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Filler Words */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">🗣️</span>
                  Filler Words
                </h3>
                <div className={`text-3xl font-bold mb-2 ${
                  feedback.speech_analysis.filler_words.count > 5 ? 'text-red-600' : 
                  feedback.speech_analysis.filler_words.count > 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {feedback.speech_analysis.filler_words.count}
                </div>
                <p className={`text-sm mb-4 p-2 rounded border ${getImpactColor(feedback.speech_analysis.filler_words.impact)}`}>
                  {feedback.speech_analysis.filler_words.impact}
                </p>
              </div>

              {/* Speaking Speed */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">⚡</span>
                  Speaking Speed
                </h3>
                <div className="text-2xl font-bold mb-2 text-blue-600">
                  {feedback.speech_analysis.speaking_speed.speed}
                </div>
                <p className={`text-sm mb-2 p-2 rounded border ${
                  feedback.speech_analysis.speaking_speed.assessment === 'Appropriate' ? 'text-green-700 bg-green-50 border-green-200' :
                  'text-yellow-700 bg-yellow-50 border-yellow-200'
                }`}>
                  {feedback.speech_analysis.speaking_speed.assessment}
                </p>
              </div>

              {/* Word Confidence */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">💪</span>
                  Word Confidence
                </h3>
                <div className="text-lg font-semibold mb-2 text-purple-600">
                  {feedback.speech_analysis.weak_words.weak_words.length > 0 ? 
                    `${feedback.speech_analysis.weak_words.weak_words.length} weak words` : 
                    'Strong language used'
                  }
                </div>
                <p className={`text-sm p-2 rounded border ${getImpactColor(feedback.speech_analysis.weak_words.professional_impact)}`}>
                  {feedback.speech_analysis.weak_words.professional_impact}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speech' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🗣️</span>
                Detailed Speech Analysis
              </h3>
              <p className="text-gray-600">Comprehensive breakdown of your speech patterns and communication effectiveness.</p>
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Objectives Analysis
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Completed Objectives */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">✅</span>
                    Objectives Achieved
                  </h4>
                  {feedback.objectives_analysis.completed.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.objectives_analysis.completed.map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-green-800 text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-700 text-sm">No specific objectives identified as completed</p>
                  )}
                </div>

                {/* Missed Objectives */}
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📋</span>
                    Areas for Focus
                  </h4>
                  {feedback.objectives_analysis.missed.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.objectives_analysis.missed.map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-orange-600 mt-1">→</span>
                          <span className="text-orange-800 text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-orange-700 text-sm">No specific missed objectives identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={startNewSession}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            🎯 Practice Again
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            📊 View Analytics
          </button>
          <button
            onClick={backToDashboard}
            className="bg-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            🏠 Dashboard
          </button>
        </div>

        {/* Analysis Info */}
        <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">
            🧠 Powered by Gemini AI
          </h4>
          <p className="text-blue-700 text-sm leading-relaxed">
            This analysis focuses on 7 key areas: filler words, speaking speed, 
            inclusive language, word confidence, repetition patterns, talk time balance, and scenario objective completion.
          </p>
        </div>
      </div>
    </div>
  );
}
