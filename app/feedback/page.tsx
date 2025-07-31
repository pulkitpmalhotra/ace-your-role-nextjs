'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SessionData {
  scenario: {
    id: string;
    title: string;
    character_name: string;
    difficulty: string;
    category: string;
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

interface DetailedFeedback {
  overall_score: number;
  category_scores: {
    opening_rapport: number;
    discovery_needs: number;
    communication_clarity: number;
    problem_solving: number;
    professionalism: number;
  };
  conversation_analysis: any;
  coaching_insights: {
    immediate_actions: string[];
    practice_areas: string[];
    advanced_techniques: string[];
    next_scenarios: string[];
  };
  improvement_areas: string[];
  strengths: string[];
  next_session_focus: string;
  skill_progression: {
    level: string;
    next: string;
    progress: number;
  };
}

export default function FeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingConversation, setAnalyzingConversation] = useState(false);
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
      
      // Trigger detailed analysis
      if (data.sessionId && data.conversation.length > 0) {
        analyzeConversation(data);
      } else {
        setLoading(false);
      }
    } else {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  const analyzeConversation = async (data: SessionData) => {
    setAnalyzingConversation(true);
    
    try {
      console.log('🧠 Starting detailed conversation analysis...');
      
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
      
      if (result.success) {
        setDetailedFeedback(result.data);
        console.log('✅ Detailed analysis completed');
      } else {
        console.error('❌ Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error analyzing conversation:', error);
    } finally {
      setAnalyzingConversation(false);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 3.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 2.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Developing';
    return 'Needs Practice';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatCategoryName = (category: string) => {
    const names: Record<string, string> = {
      opening_rapport: 'Opening & Rapport',
      discovery_needs: 'Discovery & Needs',
      communication_clarity: 'Communication Clarity',
      problem_solving: 'Problem Solving',
      professionalism: 'Professionalism'
    };
    return names[category] || category;
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Performance</h2>
          <p className="text-gray-600">Our AI is reviewing your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <span className="text-3xl text-white">📊</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Session Complete!</h1>
          <p className="text-xl text-gray-600">Here's your detailed performance analysis</p>
        </div>

        {/* Overall Score Card */}
        {detailedFeedback ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`text-6xl font-bold mb-3 ${getScoreColor(detailedFeedback.overall_score).split(' ')[0]}`}>
                  {detailedFeedback.overall_score.toFixed(1)}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getScoreColor(detailedFeedback.overall_score)}`}>
                  {getScoreLabel(detailedFeedback.overall_score)}
                </div>
                <p className="text-gray-600 mt-2">Overall Performance</p>
              </div>

              {/* Skill Level */}
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-3">
                  {detailedFeedback.skill_progression.level}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(detailedFeedback.skill_progression.progress)}`}
                    style={{ width: `${detailedFeedback.skill_progression.progress}%` }}
                  ></div>
                </div>
                <p className="text-gray-600">Skill Level</p>
                <p className="text-sm text-gray-500">Next: {detailedFeedback.skill_progression.next}</p>
              </div>

              {/* Session Stats */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-3">
                  {sessionData.exchanges}
                </div>
                <div className="text-lg text-gray-600 mb-1">
                  {sessionData.exchanges === 1 ? 'Exchange' : 'Exchanges'}
                </div>
                <p className="text-gray-600">{sessionData.duration} minutes</p>
              </div>
            </div>
          </div>
        ) : (
          /* Basic Score Card (while analyzing) */
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
            {analyzingConversation ? (
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
                <p className="text-gray-600">Analyzing your conversation for detailed insights...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{sessionData.exchanges}</div>
                  <div className="text-gray-600">Exchanges</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">{sessionData.duration}m</div>
                  <div className="text-gray-600">Duration</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Analysis */}
        {detailedFeedback && (
          <>
            {/* Skills Breakdown */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Skills Assessment
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(detailedFeedback.category_scores).map(([category, score]) => (
                  <div key={category} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatCategoryName(category)}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(score)}`}>
                        {score.toFixed(1)}/5.0
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor((score / 5) * 100)}`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {getScoreLabel(score)} - {score >= 4 ? 'Strong performance' : score >= 3 ? 'Good foundation' : 'Room for improvement'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Strengths */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
                  <span className="text-xl mr-3">✅</span>
                  Your Strengths
                </h3>
                <div className="space-y-4">
                  {detailedFeedback.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Areas */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
                  <span className="text-xl mr-3">🎯</span>
                  Focus Areas
                </h3>
                <div className="space-y-4">
                  {detailedFeedback.improvement_areas.map((area, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coaching Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Personalized Coaching
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Immediate Actions */}
                {detailedFeedback.coaching_insights.immediate_actions.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">🚀</span>
                      Quick Wins
                    </h4>
                    <ul className="space-y-2">
                      {detailedFeedback.coaching_insights.immediate_actions.map((action, index) => (
                        <li key={index} className="text-blue-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practice Areas */}
                {detailedFeedback.coaching_insights.practice_areas.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">📚</span>
                      Practice Focus
                    </h4>
                    <ul className="space-y-2">
                      {detailedFeedback.coaching_insights.practice_areas.map((area, index) => (
                        <li key={index} className="text-blue-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advanced Techniques */}
                {detailedFeedback.coaching_insights.advanced_techniques.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">⚡</span>
                      Advanced Skills
                    </h4>
                    <ul className="space-y-2">
                      {detailedFeedback.coaching_insights.advanced_techniques.map((technique, index) => (
                        <li key={index} className="text-blue-800 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          {technique}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Session Focus */}
                <div className="bg-white rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                    <span className="mr-2">🎯</span>
                    Next Session
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {detailedFeedback.next_session_focus}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Session Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-3">💬</span>
            Session Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Scenario</h4>
              <p className="text-gray-700">{sessionData.scenario.title}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Character</h4>
              <p className="text-gray-700">{sessionData.scenario.character_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Difficulty</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                sessionData.scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                sessionData.scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {sessionData.scenario.difficulty}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
              <p className="text-gray-700 capitalize">{sessionData.scenario.category}</p>
            </div>
          </div>

          {/* Conversation Preview */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Conversation Summary</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sessionData.conversation.slice(0, 6).map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                      message.speaker === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <div className={`text-xs mb-1 ${message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                      {message.speaker === 'user' ? 'You' : sessionData.scenario.character_name}
                    </div>
                    {message.message}
                  </div>
                </div>
              ))}
              {sessionData.conversation.length > 6 && (
                <p className="text-center text-gray-500 text-sm">
                  ... and {sessionData.conversation.length - 6} more messages
                </p>
              )}
            </div>
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

        {/* Encouragement */}
        <div className="text-center mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🌟 Keep Up the Great Work!
          </h3>
          <p className="text-green-700">
            Regular practice is the key to mastering professional communication skills. 
            Every conversation makes you better!
          </p>
        </div>
      </div>
    </div>
  );
}
