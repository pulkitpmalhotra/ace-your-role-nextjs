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

  const getPerformanceMessage = (exchanges: number, duration: number) => {
    if (exchanges === 0) return "Good start! 👍";
    if (exchanges < 3) return "Nice conversation! 🎉";
    if (exchanges < 6) return "Great job talking! 🌟";
    return "Excellent conversation! 🚀";
  };

  const getScoreEmoji = (exchanges: number) => {
    if (exchanges === 0) return "🌱";
    if (exchanges < 3) return "👍";
    if (exchanges < 6) return "🌟";
    return "🚀";
  };

  const backToDashboard = () => {
    localStorage.removeItem('lastSession');
    router.push('/dashboard');
  };

  const startNewChat = () => {
    localStorage.removeItem('lastSession');
    router.push('/dashboard');
  };

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Main Results */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="text-6xl mb-4">
            {getScoreEmoji(sessionData.exchanges)}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chat Complete!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {getPerformanceMessage(sessionData.exchanges, sessionData.duration)}
          </p>

          {/* Simple Stats */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {sessionData.exchanges}
              </div>
              <div className="text-sm text-blue-800">
                {sessionData.exchanges === 1 ? 'Exchange' : 'Exchanges'}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">
                {sessionData.duration}m
              </div>
              <div className="text-sm text-green-800">
                Minutes
              </div>
            </div>
          </div>

          {/* Simple Feedback */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Quick Tip:</h3>
            <p className="text-yellow-700 text-sm">
              {sessionData.exchanges < 3 
                ? "Try asking more questions in your next conversation to practice deeper discussions."
                : sessionData.exchanges < 6
                ? "Great conversation flow! Next time, try exploring different topics."
                : "Excellent work! You're building strong conversation skills."
              }
            </p>
          </div>
        </div>

        {/* Chat Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Conversation</h2>
          
          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Scenario:</strong> {sessionData.scenario.title}</p>
            <p><strong>Character:</strong> {sessionData.scenario.character_name}</p>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sessionData.conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.speaker === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className={`text-xs mb-1 ${message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {message.speaker === 'user' ? 'You' : sessionData.scenario.character_name}
                  </div>
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={startNewChat}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={backToDashboard}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Back to Conversations
          </button>
        </div>

        {/* Encouragement */}
        <div className="text-center mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            🎯 Keep practicing to improve your conversation skills!
          </p>
        </div>
      </div>
    </div>
  );
}
