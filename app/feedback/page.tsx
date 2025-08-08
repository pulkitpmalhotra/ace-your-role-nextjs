// app/feedback/page.tsx - Enhanced Speech-Focused Feedback
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

interface EnhancedFeedbackData {
  overall_score: number;
  speech_analysis: {
    filler_words: {
      frequency: number | string;
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
    word_choice: {
      weak_words: string[];
      strong_alternatives: string[];
      professional_tone: string;
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
    improvement_strategy: string;
  };
  professional_communication: {
    strengths: string[];
    weaknesses: string[];
    industry_language: string;
  };
  future_improvement: {
    priority_focus: string[];
    practice_recommendations: string[];
    next_session_goals: string[];
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

export default function EnhancedFeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<EnhancedFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'speech' | 'objectives' | 'improvement'>('overview');
  
  const router = useRouter();

  useEffect(() => {
    initializeFeedback();
  }, [router]);

  const initializeFeedback = async () => {
    try {
      // Check authentication
      const email = localStorage.getItem('userEmail');
      if (!email) {
        router.push('/');
        return;
      }

      // Load session data
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

      // Validate session data
      if (!sessionData.scenario || !sessionData.conversation || sessionData.conversation.length < 2) {
        setError('Incomplete session data. Please try a new session.');
        setLoading(false);
        return;
      }

      setSessionData(sessionData);
      
      // Generate enhanced speech analysis
      await generateEnhancedFeedback(sessionData);
      
    } catch (err) {
      console.error('❌ Feedback initialization error:', err);
      setError('Failed to load session data. Please try a new session.');
      setLoading(false);
    }
  };

  const generateEnhancedFeedback = async (data: SessionData) => {
    setAnalyzing(true);
    setError('');
    
    try {
      console.log('🧠 Generating enhanced speech analysis...');
      
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
      console.log('✅ Enhanced speech analysis completed');
      
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      setError('Analysis failed. Showing basic feedback instead.');
      
      // Generate basic fallback
      const basicFeedback = generateBasicFeedback(data);
      setFeedback(basicFeedback);
      
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const generateBasicFeedback = (data: SessionData): EnhancedFeedbackData => {
    const userMessages = data.conversation.filter(msg => msg.speaker === 'user');
    const userText = userMessages.map(msg => msg.message).join(' ');
    const wordCount = userText.split(' ').length;
    const estimatedWPM = data.duration > 0 ? Math.round(wordCount / data.duration) : 0;
    
    return {
      overall_score: 3.0,
      speech_analysis: {
        filler_words: {
          frequency: 'Analysis unavailable',
          examples: [],
          impact: 'Unable to assess without enhanced analysis'
        },
        speaking_speed: {
          speed: `${estimatedWPM} WPM - Assessment unavailable`,
          assessment: 'Enhanced analysis required for speed assessment',
          recommendation: 'Continue practicing for personalized recommendations'
        },
        inclusive_language: {
          issues: 'Analysis requires enhanced mode',
          examples: [],
          suggestions: 'Be mindful of inclusive language in professional settings'
        },
        word_choice: {
          weak_words: [],
          strong_alternatives: [],
          professional_tone: 'Basic analysis unavailable'
        },
        repetition: {
          repeated_words: [],
          frequency: 'Analysis unavailable',
          impact: 'Enhanced mode required'
        },
        talk_time: {
          user_speaking_minutes: Math.round(data.duration * 0.5),
          percentage: 50,
          balance_assessment: 'Unable to assess precisely',
          recommendation: 'Aim for balanced conversation'
        }
      },
      objectives_analysis: {
        completed: ['Basic conversation participation'],
        missed: ['Detailed analysis unavailable'],
        evidence: `Completed ${data.exchanges} exchanges`,
        improvement_strategy: 'Continue regular practice sessions'
      },
      professional_communication: {
        strengths: ['Active participation'],
        weaknesses: ['Enhanced analysis required'],
        industry_language: 'Basic professional language maintained'
      },
      future_improvement: {
        priority_focus: ['Continue practicing regularly'],
        practice_recommendations: ['Focus on conversation flow'],
        next_session_goals: ['Extend conversation length']
      },
      conversation_stats: {
        total_exchanges: data.exchanges,
        user_messages: userMessages.length,
        character_name: data.scenario.character_name,
        scenario_title: data.scenario.title,
        role_type: data.scenario.role,
        user_role_practiced: getUserRole(data.scenario.role),
        session_duration: data.duration,
        user_speaking_time: Math.round(data.duration * 0.5),
        natural_ending: data.sessionContext?.naturalEnding || false
      },
      analysis_type: 'basic-fallback'
    };
  };

  const getUserRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'sales': 'salesperson',
      'project-manager': 'project manager',
      'product-manager': 'product manager',
      'leader': 'leader',
      'manager': 'manager',
      'support-agent': 'customer service representative',
      'data-analyst': 'data analyst',
      'engineer': 'engineer',
      'nurse': 'healthcare provider',
      'doctor': 'healthcare provider'
    };
    return roleMap[role] || 'professional';
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
    if (impact.toLowerCase().includes('high') || impact.toLowerCase().includes('significant')) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (impact.toLowerCase().includes('moderate')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-green-600 bg-green-50 border-green-200';
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
            {analyzing ? 'Analyzing Your Speech Patterns...' : 'Loading Your Results'}
          </h2>
          <p className="text-gray-600">
            {analyzing ? 'Gemini AI is performing detailed speech analysis' : 'Just a moment...'}
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
              onClick={() => generateEnhancedFeedback(sessionData)}
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

  if (!feedback) return null;

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
            Detailed analysis of your communication patterns and professional skills
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
                <div className="mt-2 text-sm text-blue-600">
                  📊 Analysis: {feedback.analysis_type.includes('enhanced') ? 'Enhanced Gemini Analysis' : 'Basic Analysis'}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
                {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">Overall Communication Score</p>
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
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'speech', label: '🎤 Speech Analysis', icon: '🎤' },
            { id: 'objectives', label: '🎯 Objectives', icon: '🎯' },
            { id: 'improvement', label: '🚀 Improvement', icon: '🚀' }
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Session Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Communication Quality</h4>
                  <p className="text-blue-800 text-sm">
                    {feedback.speech_analysis.speaking_speed.assessment}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Talk Time Balance</h4>
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
                  typeof feedback.speech_analysis.filler_words.frequency === 'number' && 
                  feedback.speech_analysis.filler_words.frequency > 5 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {feedback.speech_analysis.filler_words.frequency}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {feedback.speech_analysis.filler_words.impact}
                </p>
                {Array.isArray(feedback.speech_analysis.filler_words.examples) && 
                 feedback.speech_analysis.filler_words.examples.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Examples: {feedback.speech_analysis.filler_words.examples.slice(0, 3).join(', ')}
                  </div>
                )}
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
                <p className="text-sm text-gray-600">
                  {feedback.speech_analysis.speaking_speed.recommendation}
                </p>
              </div>

              {/* Professional Tone */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">💼</span>
                  Professional Tone
                </h3>
                <div className="text-lg font-semibold mb-2 text-purple-600">
                  {feedback.speech_analysis.word_choice.professional_tone}
                </div>
                {Array.isArray(feedback.speech_analysis.word_choice.weak_words) && 
                 feedback.speech_analysis.word_choice.weak_words.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Weak words detected: {feedback.speech_analysis.word_choice.weak_words.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Speech Analysis Tab */}
        {activeTab === 'speech' && (
          <div className="space-y-8">
            
            {/* Filler Words Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🗣️</span>
                Filler Words Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    typeof feedback.speech_analysis.filler_words.frequency === 'number' && 
                    feedback.speech_analysis.filler_words.frequency > 5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {feedback.speech_analysis.filler_words.frequency}
                  </div>
                  <div className="text-sm text-gray-600">Total Count</div>
                </div>
                <div className="col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Impact Assessment</h4>
                  <div className={`p-3 rounded-lg border ${getImpactColor(feedback.speech_analysis.filler_words.impact)}`}>
                    {feedback.speech_analysis.filler_words.impact}
                  </div>
                  {Array.isArray(feedback.speech_analysis.filler_words.examples) && 
                   feedback.speech_analysis.filler_words.examples.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Examples:</h5>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {feedback.speech_analysis.filler_words.examples.slice(0, 3).map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Speaking Speed */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                Speaking Speed Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Current Speed</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {feedback.speech_analysis.speaking_speed.speed}
                  </div>
                  <p className="text-sm text-gray-600">
                    {feedback.speech_analysis.speaking_speed.assessment}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recommendation</h4>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      {feedback.speech_analysis.speaking_speed.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Word Choice & Language */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Inclusive Language */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">🤝</span>
                  Inclusive Language
                </h3>
                <div className={`p-4 rounded-lg border ${getImpactColor(feedback.speech_analysis.inclusive_language.issues)}`}>
                  <p className="text-sm font-medium mb-2">Assessment:</p>
                  <p className="text-sm">{feedback.speech_analysis.inclusive_language.issues}</p>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Suggestion:</strong> {feedback.speech_analysis.inclusive_language.suggestions}
                  </p>
                </div>
              </div>

              {/* Word Choice */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-3">💪</span>
                  Word Choice
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Professional Tone:</p>
                    <p className="text-sm text-gray-600">{feedback.speech_analysis.word_choice.professional_tone}</p>
                  </div>
                  
                  {Array.isArray(feedback.speech_analysis.word_choice.weak_words) && 
                   feedback.speech_analysis.word_choice.weak_words.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Weak Words Found:</p>
                      <div className="flex flex-wrap gap-1">
                        {feedback.speech_analysis.word_choice.weak_words.slice(0, 5).map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {Array.isArray(feedback.speech_analysis.word_choice.strong_alternatives) && 
                   feedback.speech_analysis.word_choice.strong_alternatives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Suggested Alternatives:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {feedback.speech_analysis.word_choice.strong_alternatives.slice(0, 3).map((alt, index) => (
                          <li key={index}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Repetition Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🔄</span>
                Repetition Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Frequency Assessment</h4>
                  <p className="text-sm text-gray-600 mb-3">{feedback.speech_analysis.repetition.frequency}</p>
                  
                  {Array.isArray(feedback.speech_analysis.repetition.repeated_words) && 
                   feedback.speech_analysis.repetition.repeated_words.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Repeated Words/Phrases:</p>
                      <div className="flex flex-wrap gap-1">
                        {feedback.speech_analysis.repetition.repeated_words.slice(0, 5).map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Impact on Communication</h4>
                  <div className={`p-4 rounded-lg border ${getImpactColor(feedback.speech_analysis.repetition.impact)}`}>
                    <p className="text-sm">{feedback.speech_analysis.repetition.impact}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Talk Time Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">⏰</span>
                Talk Time Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {feedback.speech_analysis.talk_time.user_speaking_minutes}m
                  </div>
                  <div className="text-sm text-gray-600">Your Speaking Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {feedback.speech_analysis.talk_time.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Of Total Session</div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Balance Assessment</h4>
                  <div className={`p-3 rounded-lg border text-sm ${
                    feedback.speech_analysis.talk_time.balance_assessment.toLowerCase().includes('appropriate') ||
                    feedback.speech_analysis.talk_time.balance_assessment.toLowerCase().includes('good') ?
                    'bg-green-50 text-green-800 border-green-200' :
                    'bg-yellow-50 text-yellow-800 border-yellow-200'
                  }`}>
                    {feedback.speech_analysis.talk_time.balance_assessment}
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Recommendation:</strong> {feedback.speech_analysis.talk_time.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Objectives Tab */}
        {activeTab === 'objectives' && (
          <div className="space-y-8">
            
            {/* Objectives Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Scenario Objectives Analysis
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Completed Objectives */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">✅</span>
                    Objectives Achieved
                  </h4>
                  {Array.isArray(feedback.objectives_analysis.completed) && 
                   feedback.objectives_analysis.completed.length > 0 ? (
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
                  {Array.isArray(feedback.objectives_analysis.missed) && 
                   feedback.objectives_analysis.missed.length > 0 ? (
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

              {/* Evidence */}
              <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Evidence from Conversation</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {feedback.objectives_analysis.evidence}
                </p>
              </div>

              {/* Improvement Strategy */}
              <div className="mt-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">Strategic Improvement Plan</h4>
                <p className="text-purple-800 text-sm leading-relaxed">
                  {feedback.objectives_analysis.improvement_strategy}
                </p>
              </div>
            </div>

            {/* Professional Communication Assessment */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">💼</span>
                Professional Communication Assessment
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Strengths */}
                <div>
                  <h4 className="text-lg font-semibold text-green-800 mb-4">Communication Strengths</h4>
                  {Array.isArray(feedback.professional_communication.strengths) && 
                   feedback.professional_communication.strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {feedback.professional_communication.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-green-600 text-sm">✓</span>
                          </div>
                          <span className="text-gray-700 text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">Strengths analysis not available</p>
                  )}
                </div>

                {/* Areas for Development */}
                <div>
                  <h4 className="text-lg font-semibold text-orange-800 mb-4">Development Areas</h4>
                  {Array.isArray(feedback.professional_communication.weaknesses) && 
                   feedback.professional_communication.weaknesses.length > 0 ? (
                    <ul className="space-y-3">
                      {feedback.professional_communication.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-orange-600 text-sm">→</span>
                          </div>
                          <span className="text-gray-700 text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">Development areas analysis not available</p>
                  )}
                </div>
              </div>

              {/* Industry Language Assessment */}
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Industry Language Usage</h4>
                <p className="text-gray-700 text-sm">
                  {feedback.professional_communication.industry_language}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Improvement Tab */}
        {activeTab === 'improvement' && (
          <div className="space-y-8">
            
            {/* Priority Focus Areas */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Priority Focus Areas
              </h3>
              
              {Array.isArray(feedback.future_improvement.priority_focus) && 
               feedback.future_improvement.priority_focus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {feedback.future_improvement.priority_focus.slice(0, 3).map((focus, index) => (
                    <div key={index} className="bg-red-50 rounded-lg p-6 border border-red-200 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-2">#{index + 1}</div>
                      <h4 className="font-semibold text-red-800 mb-2">Priority Focus</h4>
                      <p className="text-red-700 text-sm">{focus}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Priority focus areas analysis not available</p>
                </div>
              )}
            </div>

            {/* Practice Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🏋️</span>
                Practice Recommendations
              </h3>
              
              {Array.isArray(feedback.future_improvement.practice_recommendations) && 
               feedback.future_improvement.practice_recommendations.length > 0 ? (
                <div className="space-y-4">
                  {feedback.future_improvement.practice_recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-blue-900 font-medium text-sm mb-1">Practice Exercise</p>
                        <p className="text-blue-800 text-sm">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Practice recommendations not available</p>
                </div>
              )}
            </div>

            {/* Next Session Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🚀</span>
                Next Session Goals
              </h3>
              
              {Array.isArray(feedback.future_improvement.next_session_goals) && 
               feedback.future_improvement.next_session_goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feedback.future_improvement.next_session_goals.map((goal, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center mb-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <h4 className="font-semibold text-green-800">Goal {index + 1}</h4>
                      </div>
                      <p className="text-green-700 text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Next session goals not available</p>
                </div>
              )}
            </div>

            {/* Action Plan */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Your Action Plan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-4">Immediate Actions (This Week)</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Focus on reducing filler words in daily conversations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Practice speaking at an appropriate pace for your role</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Record yourself speaking to identify patterns</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-4">Long-term Development (This Month)</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Complete 3-4 more practice sessions weekly</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Work on achieving all scenario objectives</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Build confidence in professional vocabulary</span>
                    </li>
                  </ul>
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

        {/* Analysis Source Info */}
        {feedback.analysis_type && (
          <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-800 mb-3">
              {feedback.analysis_type.includes('enhanced') ? '🧠 Enhanced Gemini Analysis' : '📊 Basic Analysis'}
            </h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              {feedback.analysis_type.includes('enhanced') 
                ? 'This comprehensive analysis was generated by Gemini AI, examining your speech patterns, filler words, speaking speed, inclusive language, word choice, repetition, talk time balance, and scenario objective completion.'
                : 'This analysis provides basic feedback on your conversation. For detailed speech pattern analysis including filler words, speaking speed, and objective completion, enhanced analysis with Gemini AI is recommended.'
              }
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-blue-600">
              <span className="bg-blue-100 px-3 py-1 rounded-full">
                🎤 Speech Patterns Analyzed
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">
                🎯 Objectives Assessed
              </span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">
                📈 Improvement Recommended
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
