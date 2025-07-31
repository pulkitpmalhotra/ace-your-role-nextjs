'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  difficulty: string;
  category: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }
    setUserEmail(email);
    
    // Load scenarios
    loadScenarios();
  }, [router]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scenarios');
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.data || []);
      } else {
        console.error('Failed to load scenarios:', data.error);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = (scenario: Scenario) => {
    localStorage.setItem('currentScenario', JSON.stringify(scenario));
    router.push(`/session/${scenario.id}`);
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentScenario');
    router.push('/');
  };

  const getUserName = () => {
    return userEmail ? userEmail.split('@')[0] : 'User';
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
      'healthcare': '🏥',
      'support': '🎧',
      'legal': '⚖️',
      'leadership': '👥'
    };
    return emojiMap[category] || '💬';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading practice sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Conversations</h1>
                <p className="text-sm text-gray-600">Talk with AI characters to improve your skills</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Hi, {getUserName()}!</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Ready to Practice? 🚀
              </h2>
              <p className="text-gray-600 text-lg mb-4">
                Choose a conversation below and start talking with an AI character
              </p>
              <div className="flex justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Real conversations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">✓</span>
                  <span>Instant feedback</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500">✓</span>
                  <span>Practice anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario, index) => (
            <div 
              key={scenario.id} 
              className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 hover:border-blue-200"
            >
              {/* Category and Difficulty */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">
                  {getCategoryEmoji(scenario.category)}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                  {scenario.difficulty}
                </span>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {scenario.title}
              </h3>
              
              {/* Description */}
              {scenario.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {scenario.description}
                </p>
              )}
              
              {/* Character */}
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Talk with:</span> {scenario.character_name}
                </p>
                <p className="text-xs text-gray-600">{scenario.character_role}</p>
              </div>
              
              {/* Simple Start Button */}
              <button
                onClick={() => startChat(scenario)}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Start Talking
              </button>
            </div>
          ))}
        </div>

        {/* No scenarios message */}
        {scenarios.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No practice sessions available</h3>
            <p className="text-gray-600">
              We're loading new conversations. Please check back soon!
            </p>
          </div>
        )}

        {/* Simple Help */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span>Pick a conversation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Click "Start Talking"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Have a real conversation</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
