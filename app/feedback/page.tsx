'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SessionData {
  scenario: {
    id: string;
    title: string;
    character_name: string;
    difficulty: string;
  };
  conversation: Array<{
    speaker: 'user' | 'ai';
    message: string;
    timestamp: number;
  }>;
  duration: number;
  exchanges: number;
  userEmail: string;
}

export default function FeedbackPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
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
      setSessionData(JSON.parse(lastSession));
    } else {
      router.push('/dashboard');
      return;
    }
    
    setLoading(false);
  }, [router]);

  const getPerformanceScore = (exchanges: number, duration: number) => {
    let score = 0;
    
    // Base score from engagement
    if (exchanges >= 1) score += 2;
    if (exchanges >= 3) score += 1;
    if (exchanges >= 5) score += 1;
    if (exchanges >= 8) score += 1;
    
    // Duration bonus (sweet spot is 5-15 minutes)
    if (duration >= 2 && duration <= 20) score += 0.5;
    
    return Math.min(5, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Fair';
    return 'Needs Practice';
  };

  const generateFeedback = (exchanges: number, duration: number, difficulty: string) => {
    const suggestions = [];
    
    if (exchanges < 3) {
      suggestions.push("Try to engage more deeply with follow-up questions");
      suggestions.push("Explore the character's needs and pain points");
    } else if (exchanges < 6) {
      suggestions.push("Great engagement! Try to dig deeper into specific requirements");
      suggestions.push("Work on transitioning from discovery to solution presentation");
    } else {
      suggestions.push("Excellent conversation flow! Focus on closing techniques");
      suggestions.push("Practice handling objections and next steps");
    }
    
    if (duration < 2) {
      suggestions.push("Consider longer conversations to build stronger rapport");
    } else if (duration > 20) {
      suggestions.push("Work on being more concise while maintaining engagement");
    }
    
    if (difficulty === 'advanced') {
      suggestions.push("Challenge yourself with more complex scenarios");
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your session...</p>
        </div>
      </div>
    );
  }

  const score = getPerformanceScore(sessionData.exchanges, sessionData.duration);
  const suggestions = generateFeedback(sessionData.exchanges, sessionData.duration, sessionData.scenario.difficulty);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h1>
          <p className="text-gray-600">Here's how you performed</p>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
                {score.toFixed(1)}/5.0
              </div>
              <div className={`font-semibold mb-1 ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </div>
              <p className="text-sm text-gray-600">Overall Performance</p>
            </div>

            {/* Exchanges */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {sessionData.exchanges}
              </div>
              <div className="font-semibold text-blue-600 mb-1">
                {sessionData.exchanges === 1 ? 'Exchange' : 'Exchanges'}
              </div>
              <p className="text-sm text-gray-600">Conversation Depth</p>
            </div>

            {/* Duration */}
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {sessionData.duration}m
              </div>
              <div className="font-semibold text-purple-600 mb-1">
                Duration
              </div>
              <p className="text-sm text-gray-600">Time Engaged</p>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Scenario</h3>
              <p className="text-gray-600">{sessionData.scenario.title}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Character</h3>
              <p className="text-gray-600">{sessionData.scenario.character_name}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Difficulty</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                sessionData.scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                sessionData.scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {sessionData.scenario.difficulty}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">AI Model</h3>
              <p className="text-gray-600">Gemini 2.5 Flash-Lite ⚡</p>
            </div>
          </div>
        </div>

        {/* Suggestions for Improvement */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Suggestions for Improvement</h2>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Replay */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💬 Conversation Replay</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sessionData.conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-2 rounded-lg ${
                    message.speaker === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.speaker === 'user' ? 'You' : sessionData.scenario.character_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={startNewSession}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start New Session
          </button>
          <button
            onClick={backToDashboard}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Next Steps */}
        <div className="text-center mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 Coming Soon</h3>
          <p className="text-blue-700 text-sm">
            Enhanced feedback analysis • Google Speech integration • Advanced analytics
          </p>
        </div>
      </div>
    </div>
  );
}
