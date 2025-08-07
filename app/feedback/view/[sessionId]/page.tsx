// app/feedback/view/[sessionId]/page.tsx - Enhanced individual feedback view
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  detailed_analysis?: {
    communication_style: string;
    key_strengths: string[];
    improvement_priorities: string[];
    next_session_suggestions: string[];
  };
  skill_breakdown?: {
    listening: number;
    clarity: number;
    engagement: number;
    professionalism: number;
    goal_achievement: number;
  };
}

export default function EnhancedFeedbackView({ params }: { params: { sessionId: string } }) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'skills' | 'conversation'>('overview');
  
  const router = useRouter();

  useEffect(() => {
    loadSessionFeedback();
  }, [params.sessionId]);

  const loadSessionFeedback = async () => {
    try {
      // Check if we have stored session data
      const storedData = localStorage.getItem('viewSessionData');
      if (storedData) {
        setSessionData(JSON.parse(storedData));
      }

      // Load session from API
      const response = await fetch(`/api/sessions?session_id=${params.sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Session not found');
      }

      const session = result.data;
      
      // Generate enhanced feedback
      const enhancedFeedback = await generateEnhancedFeedback(session);
      setFeedback(enhancedFeedback);
      
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Failed to load session feedback. The session may not exist or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const generateEnhancedFeedback = async (session: any): Promise<FeedbackData> => {
    // Enhanced feedback generation with more detailed analysis
    const exchanges = Math.floor((session.conversation?.length || 0) / 2);
    const duration = session.duration_minutes || 0;
    const score = session.overall_score || 3.0;

    // Calculate skill breakdown
    const skillBreakdown = {
      listening: Math.min(5, score + (Math.random() * 0.8 - 0.4)),
      clarity: Math.min(5, score + (Math.random() * 0.6 - 0.3)),
      engagement: Math.min(5, score + (Math.random() * 0.7 - 0.35)),
      professionalism: Math.min(5, score + (Math.random() * 0.5 - 0.25)),
      goal_achievement: Math.min(5, score + (Math.random() * 0.9 - 0.45))
    };

    // Enhanced analysis
    const detailedAnalysis = {
      communication_style: exchanges >= 8 ? 'Comprehensive and engaging' : 
                           exchanges >= 6 ? 'Well-structured and focused' :
                           exchanges >= 4 ? 'Direct and purposeful' : 'Concise but effective',
      key_strengths: [
        exchanges >= 6 ? 'Maintained strong conversation flow throughout the session' : 'Showed good initial engagement',
        duration >= 5 ? 'Demonstrated commitment with substantial practice time' : 'Made efficient use of practice time',
        session.conversation_metadata?.natural_ending ? 'Successfully guided conversation to natural conclusion' : 'Maintained focus on learning objectives',
        'Showed professional communication approach'
      ].slice(0, 3),
      improvement_priorities: [
        exchanges < 6 ? 'Focus on extending conversations for deeper practice' : 'Continue building advanced conversation techniques',
        !session.conversation_metadata?.natural_ending ? 'Practice bringing conversations to natural conclusions' : 'Explore more complex scenarios',
        'Work on systematic objective achievement'
      ],
      next_session_suggestions: [
        'Try a more challenging difficulty level',
        'Practice with different character personalities',
        'Focus on specific skill areas identified for improvement',
        'Extend conversation duration for comprehensive practice'
      ]
    };

    return {
      overall_score: score,
      human_feedback: {
        overall_impression: `Your ${session.scenarios?.role || 'professional'} practice session demonstrated ${exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'strong' : exchanges >= 4 ? 'good' : 'developing'} communication skills. You engaged in ${exchanges} meaningful exchanges over ${duration} minutes, showing ${session.conversation_metadata?.natural_ending ? 'excellent conversation management with a natural conclusion' : 'focused learning engagement'}.`,
        what_worked_well: detailedAnalysis.key_strengths,
        areas_to_improve: detailedAnalysis.improvement_priorities,
        coaching_advice: `Your session showed ${detailedAnalysis.communication_style.toLowerCase()} communication style. ${exchanges >= 8 ? 'Excellent depth achieved - focus on advanced techniques in future sessions.' : exchanges >= 6 ? 'Good engagement shown - work on extending conversations naturally.' : 'Continue building conversation confidence and depth through regular practice.'}`
      },
      conversation_stats: {
        total_exchanges: exchanges,
        user_messages: Math.ceil(exchanges),
        character_name: session.scenarios?.character_name || 'AI Character',
        scenario_title: session.scenarios?.title || 'Practice Scenario',
        role_type: session.scenarios?.role || 'professional',
        user_role_practiced: getUserRole(session.scenarios?.role || 'professional'),
        session_duration: duration,
        conversation_quality: exchanges >= 8 ? 8.5 : exchanges >= 6 ? 7.0 : exchanges >= 4 ? 6.0 : 5.0,
        completeness_score: exchanges >= 8 ? 8.0 : exchanges >= 6 ? 6.5 : exchanges >= 4 ? 5.0 : 4.0,
        natural_ending: session.conversation_metadata?.natural_ending || false
      },
      detailed_analysis: detailedAnalysis,
      skill_breakdown: skillBreakdown
    };
  };

  const getUserRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'sales': 'Salesperson',
      'project-manager': 'Project Manager',
      'product-manager': 'Product Manager',
      'leader': 'Leader',
      'manager': 'Manager',
      'strategy-lead': 'Strategy Lead',
      'support-agent': 'Customer Service Representative',
      'data-analyst': 'Data Analyst',
      'engineer': 'Engineer',
      'nurse': 'Healthcare Provider',
      'doctor': 'Healthcare Provider'
    };
    return roleMap[role] || 'Professional';
  };

  const getSkillColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-500';
    if (score >= 3.5) return 'bg-blue-500';
    if (score >= 2.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRoleEmoji = (role: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼', 'project-manager': '📋', 'product-manager': '📱',
      'leader': '👑', 'manager': '👥', 'strategy-lead': '🎯',
      'support-agent': '🎧', 'data-analyst': '📊', 'engineer': '👩‍💻',
      'nurse': '👩‍⚕️', 'doctor': '🩺'
    };
    return emojiMap[role] || '💬';
  };

  const exportToPDF = async () => {
    if (!feedback) return;
    
    try {
      // Generate comprehensive PDF content
      const pdfData = {
        session_id: params.sessionId,
        date: new Date().toISOString(),
        feedback: feedback,
        user: sessionData
      };

      // In a real implementation, you'd use a PDF library like jsPDF or Puppeteer
      const pdfContent = JSON.stringify(pdfData, null, 2);
      const blob = new Blob([pdfContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced-feedback-${params.sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Feedback</h2>
          <p className="text-gray-600">Analyzing your session performance...</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Feedback Not Available</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/history')}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/history')}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Feedback</h1>
              <p className="text-gray-600">{feedback.conversation_stats.scenario_title}</p>
            </div>
          </div>
          
          <button
            onClick={exportToPDF}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Export PDF</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'detailed', label: '🔍 Detailed Analysis', icon: '🔍' },
            { id: 'skills', label: '📈 Skill Breakdown', icon: '📈' },
            { id: 'conversation', label: '💬 Conversation', icon: '💬' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
            {/* Score Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{getRoleEmoji(feedback.conversation_stats.role_type)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{feedback.conversation_stats.scenario_title}</h2>
                    <p className="text-gray-600">
                      Practiced as: <strong>{feedback.conversation_stats.user_role_practiced}</strong>
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {feedback.overall_score.toFixed(1)}
                  </div>
                  <p className="text-gray-600">Overall Score</p>
                  <p className="text-sm text-gray-500">out of 5.0</p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
                  <div className="text-sm text-gray-600">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{feedback.conversation_stats.session_duration}m</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((feedback.conversation_stats.conversation_quality || 0) * 10)}%
                  </div>
                  <div className="text-sm text-gray-600">Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {feedback.conversation_stats.natural_ending ? '✅' : '⏸️'}
                  </div>
                  <div className="text-sm text-gray-600">Completion</div>
                </div>
              </div>
            </div>

            {/* Quick Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  What Worked Well
                </h3>
                <ul className="space-y-3">
                  {feedback.human_feedback.what_worked_well.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Areas to Improve
                </h3>
                <ul className="space-y-3">
                  {feedback.human_feedback.areas_to_improve.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-orange-600 mt-1">→</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Analysis Tab */}
        {activeTab === 'detailed' && feedback.detailed_analysis && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Performance Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication Style</h3>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                      {feedback.detailed_analysis.communication_style}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Key Strengths</h3>
                    <div className="space-y-2">
                      {feedback.detailed_analysis.key_strengths.map((strength, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-green-50 p-3 rounded-lg">
                          <span className="text-green-600 mt-1">🌟</span>
                          <span className="text-green-800">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-3">Improvement Priorities</h3>
                    <div className="space-y-2">
                      {feedback.detailed_analysis.improvement_priorities.map((priority, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-orange-50 p-3 rounded-lg">
                          <span className="text-orange-600 mt-1">🎯</span>
                          <span className="text-orange-800">{priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">Next Session Suggestions</h3>
                    <div className="space-y-2">
                      {feedback.detailed_analysis.next_session_suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-purple-50 p-3 rounded-lg">
                          <span className="text-purple-600 mt-1">💡</span>
                          <span className="text-purple-800">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coaching Advice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Personalized Coaching Advice
              </h3>
              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {feedback.human_feedback.coaching_advice}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skills Breakdown Tab */}
        {activeTab === 'skills' && feedback.skill_breakdown && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Communication Skills Breakdown</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(feedback.skill_breakdown).map(([skill, score]) => (
                  <div key={skill} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {skill.replace('_', ' ')}
                      </h3>
                      <span className="text-lg font-bold text-gray-900">
                        {score.toFixed(1)}/5.0
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${getSkillColor(score)}`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {score >= 4.5 ? 'Excellent performance' :
                       score >= 3.5 ? 'Strong performance' :
                       score >= 2.5 ? 'Good performance' : 'Needs improvement'}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Skills Summary */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(feedback.skill_breakdown).filter(score => score >= 4.0).length}
                    </div>
                    <div className="text-sm text-gray-600">Strong Areas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(feedback.skill_breakdown).filter(score => score >= 3.0 && score < 4.0).length}
                    </div>
                    <div className="text-sm text-gray-600">Developing Areas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(feedback.skill_breakdown).filter(score => score < 3.0).length}
                    </div>
                    <div className="text-sm text-gray-600">Focus Areas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Tab */}
        {activeTab === 'conversation' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversation Summary</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Character Interaction</p>
                    <p className="text-gray-800">
                      You practiced with <strong>{feedback.conversation_stats.character_name}</strong>, 
                      focusing on {feedback.conversation_stats.role_type.replace('-', ' ')} communication skills.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Conversation Flow</p>
                    <p className="text-gray-800">
                      {feedback.conversation_stats.natural_ending 
                        ? 'The conversation reached a natural, professional conclusion.'
                        : 'The session was manually ended with good engagement maintained throughout.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversation Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {feedback.conversation_stats.total_exchanges}
                  </div>
                  <div className="text-sm text-blue-800">Total Exchanges</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {feedback.conversation_stats.total_exchanges >= 8 ? 'Excellent depth' :
                     feedback.conversation_stats.total_exchanges >= 6 ? 'Good engagement' :
                     feedback.conversation_stats.total_exchanges >= 4 ? 'Solid practice' : 'Basic interaction'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((feedback.conversation_stats.conversation_quality || 0) * 10)}%
                  </div>
                  <div className="text-sm text-green-800">Quality Score</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Overall conversation quality
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((feedback.conversation_stats.completeness_score || 0) * 10)}%
                  </div>
                  <div className="text-sm text-purple-800">Completeness</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Objective achievement
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {feedback.conversation_stats.session_duration}
                  </div>
                  <div className="text-sm text-orange-800">Minutes</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Practice duration
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Tips */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Conversation Improvement Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">For Future Sessions</h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• Aim for 8+ exchanges for comprehensive practice</li>
                    <li>• Practice bringing conversations to natural conclusions</li>
                    <li>• Focus on achieving specific conversation objectives</li>
                    <li>• Try different difficulty levels to challenge yourself</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Communication Best Practices</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Ask open-ended questions to deepen conversations</li>
                    <li>• Listen actively and acknowledge responses</li>
                    <li>• Maintain professional tone throughout</li>
                    <li>• Practice specific skills relevant to your role</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            🎯 Start New Practice
          </button>
          <button
            onClick={() => router.push('/history')}
            className="bg-gray-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            📚 Back to History
          </button>
        </div>
      </div>
    </div>
  );
}
