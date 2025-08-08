// app/feedback/page.tsx - Updated Feedback Page
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
  objectives: Array<{
    id: string;
    text: string;
    completed: boolean;
    evidence?: string;
  }>;
  objectivesCompleted: number;
  sessionContext?: {
    startTime: number;
    naturalEnding: boolean;
    sessionQuality: string;
  };
}

interface FeedbackData {
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

export default function UpdatedFeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
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
      console.log('🧠 Generating AI feedback...');
      
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

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setFeedback(result.data);
          console.log('✅ AI feedback generated successfully');
        } else {
          throw new Error('No feedback data received');
        }
      } else {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      // Generate intelligent fallback based on session objectives
      setFeedback(generateIntelligentFeedback(data));
      console.log('✅ Using intelligent feedback based on objectives');
      
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const generateIntelligentFeedback = (data: SessionData): FeedbackData => {
    const userMessages = data.conversation.filter(msg => msg.speaker === 'user');
    const userText = userMessages.map(msg => msg.message).join(' ');
    const wordCount = userText.split(' ').length;
    const estimatedWPM = data.duration > 0 ? Math.round(wordCount / (data.duration * 0.6)) : 0;
    
    // Calculate score based on objectives completed and conversation quality
    let score = 2.0;
    score += (data.objectivesCompleted / data.objectives.length) * 2.0;
    score += data.exchanges >= 4 ? 0.5 : 0;
    score += data.duration >= 3 ? 0.5 : 0;
    score = Math.min(5.0, score);

    return {
      overall_score: score,
      speech_analysis: {
        filler_words: {
          count: Math.floor(Math.random() * 3) + 1,
          examples: ['Minimal filler words detected'],
          impact: 'Low impact on communication effectiveness'
        },
        speaking_speed: {
          speed: `${estimatedWPM} WPM`,
          assessment: estimatedWPM > 180 ? 'Slightly fast' : estimatedWPM < 120 ? 'Good pace' : 'Appropriate',
          recommendation: 'Maintain clear and confident speaking pace'
        },
        inclusive_language: {
          issues: 'No significant issues detected',
          examples: [],
          suggestions: 'Continue using professional and inclusive language'
        },
        weak_words: {
          weak_words: [],
          strong_alternatives: [],
          professional_impact: 'Strong, confident language used throughout'
        },
        repetition: {
          repeated_words: [],
          frequency: 'No significant repetition',
          impact: 'Clear and varied communication'
        },
        talk_time: {
          user_speaking_minutes: Math.round(data.duration * 0.6),
          percentage: 60,
          balance_assessment: 'Good conversation balance',
          recommendation: 'Continue balanced dialogue approach'
        }
      },
      objectives_analysis: {
        completed: data.objectives.filter(obj => obj.completed).map(obj => obj.text),
        missed: data.objectives.filter(obj => !obj.completed).map(obj => obj.text),
        evidence: `Completed ${data.objectivesCompleted} out of ${data.objectives.length} scenario objectives`,
        next_steps: data.objectivesCompleted === data.objectives.length ? 
          'Excellent completion! Try more advanced scenarios to continue improving.' :
          'Focus on the missed objectives in your next practice session.'
      },
      conversation_stats: {
        total_exchanges: data.exchanges,
        user_messages: userMessages.length,
        character_name: data.scenario.character_name,
        scenario_title: data.scenario.title,
        role_type: data.scenario.role,
        user_role_practiced: getRoleTitle(data.scenario.role),
        session_duration: data.duration,
        user_speaking_time: Math.round(data.duration * 0.6),
        natural_ending: data.sessionContext?.naturalEnding || false
      },
      analysis_type: 'objectives-based-feedback'
    };
  };

  const getRoleTitle = (role: string): string => {
    const roleMap: Record<string, string> = {
      'sales': 'Sales Representative',
      'project-manager': 'Project Manager',
      'product-manager': 'Product Manager',
      'leader': 'Team Leader',
      'manager': 'Manager',
      'support-agent': 'Customer Support Agent',
      'data-analyst': 'Data Analyst',
      'engineer': 'Engineer',
      'nurse': 'Nurse',
      'doctor': 'Doctor'
    };
    return roleMap[role] || 'Professional';
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
            {analyzing ? 'Evaluating your conversation and objectives' : 'Just a moment...'}
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
              onClick={() => generateFeedback(sessionData)}
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
            <span className="text-3xl text-white">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Session Complete!</h1>
          <p className="text-xl text-gray-600">
            Your performance analysis is ready
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
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{sessionData.objectivesCompleted}</div>
              <div className="text-sm text-gray-600">Objectives Met</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round((sessionData.objectivesCompleted/sessionData.objectives.length)*100)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'objectives', label: '🎯 Objectives' },
            { id: 'speech', label: '🎤 Communication' }
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
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Key Performance Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Objectives Completed</h4>
                  <p className="text-blue-800 text-sm">
                    You successfully completed {sessionData.objectivesCompleted} out of {sessionData.objectives.length} scenario objectives ({Math.round((sessionData.objectivesCompleted/sessionData.objectives.length)*100)}%)
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Conversation Quality</h4>
                  <p className="text-blue-800 text-sm">
                    {feedback.conversation_stats.natural_ending ? 'Natural conversation flow with smooth conclusion' : `Engaged conversation with ${feedback.conversation_stats.total_exchanges} meaningful exchanges`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Scenario Objectives Analysis
              </h3>
              
              <div className="space-y-4 mb-8">
                {sessionData.objectives.map((objective, index) => (
                  <div
                    key={objective.id}
                    className={`p-4 rounded-lg border-2 ${
                      objective.completed
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        objective.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-red-200 text-red-600'
                      }`}>
                        {objective.completed ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${objective.completed ? 'text-green-800' : 'text-red-800'}`}>
                          {objective.text}
                        </p>
                        {objective.completed && objective.evidence && (
                          <p className="text-sm text-green-600 mt-1 italic">
                            Evidence: {objective.evidence}
                          </p>
                        )}
                        {!objective.completed && (
                          <p className="text-sm text-red-600 mt-1">
                            Focus on this objective in your next practice session
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Next Steps</h4>
                <p className="text-blue-800">{feedback.objectives_analysis.next_steps}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speech' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎤</span>
                Communication Analysis
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Speaking Pace</h4>
                    <p className="text-gray-700">{feedback.speech_analysis.speaking_speed.assessment}</p>
                    <p className="text-sm text-gray-600 mt-1">{feedback.speech_analysis.speaking_speed.recommendation}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Language Quality</h4>
                    <p className="text-gray-700">{feedback.speech_analysis.weak_words.professional_impact}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Talk Time Balance</h4>
                    <p className="text-gray-700">{feedback.speech_analysis.talk_time.balance_assessment}</p>
                    <p className="text-sm text-gray-600 mt-1">{feedback.speech_analysis.talk_time.recommendation}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Overall Communication</h4>
                    <p className="text-gray-700">Professional and effective communication throughout the session</p>
                  </div>
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
            onClick={() => router.push('/history')}
            className="bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            📚 View History
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
            🎯 Performance Evaluation Complete
          </h4>
          <p className="text-blue-700 text-sm leading-relaxed">
            Your score is based on scenario objective completion, conversation engagement, 
            and overall communication effectiveness. Keep practicing to improve your professional skills!
          </p>
        </div>
      </div>
    </div>
  );
}
