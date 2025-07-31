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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
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

  const filteredScenarios = scenarios.filter(scenario => {
    const categoryMatch = selectedCategory === 'all' || scenario.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch && scenario.is_active;
  });

  const startSession = (scenario: Scenario) => {
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

  const getUserInitials = () => {
    const name = getUserName();
    return name.slice(0, 2).toUpperCase();
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'sales': '💼',
      'healthcare': '🏥',
      'support': '🎧',
      'legal': '⚖️',
      'leadership': '👥'
    };
    return emojiMap[category] || '🎯';
  };

  const getCategoryGradient = (category: string) => {
    const gradientMap: Record<string, string> = {
      'sales': 'from-blue-500 to-indigo-600',
      'healthcare': 'from-green-500 to-emerald-600',
      'support': 'from-purple-500 to-violet-600',
      'legal': 'from-orange-500 to-red-600',
      'leadership': 'from-pink-500 to-rose-600'
    };
    return gradientMap[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing your AI training scenarios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative glass border-b border-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Ace Your Role</h1>
                <p className="text-sm text-gray-600">AI-Powered Training Platform</p>
              </div>
            </div>

            {/* User profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-soft">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-gray-900 text-sm">{getUserName()}</p>
                  <p className="text-xs text-gray-600">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-ghost btn-sm text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="card p-6 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {getUserName()}! 👋
                </h2>
                <p className="text-gray-600 text-lg">
                  Ready to enhance your conversation skills with AI-powered roleplay training?
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{scenarios.length}</div>
                    <div className="text-xs text-gray-500">Scenarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">95%</div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">43%</div>
                    <div className="text-xs text-gray-500">Cost ↓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in">
          <div className="card-hover p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-soft mr-4">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Gemini 2.5 Flash-Lite</h3>
                <p className="text-sm text-blue-700">Enhanced AI conversations</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600">43% cost reduction</span>
              <span className="badge-primary">Active</span>
            </div>
          </div>
          
          <div className="card-hover p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-soft mr-4">
                🎤
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Voice Conversations</h3>
                <p className="text-sm text-green-700">Natural speech interaction</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">95%+ accuracy</span>
              <span className="badge-success">Ready</span>
            </div>
          </div>
          
          <div className="card-hover p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-xl shadow-soft mr-4">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Smart Feedback</h3>
                <p className="text-sm text-purple-700">AI-powered analysis</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600">Personalized insights</span>
              <span className="badge badge-purple-100 text-purple-800">Enhanced</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8 animate-slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Find Your Perfect Scenario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="all">All Categories</option>
                <option value="sales">💼 Sales</option>
                <option value="healthcare">🏥 Healthcare</option>
                <option value="support">🎧 Support</option>
                <option value="legal">⚖️ Legal</option>
                <option value="leadership">👥 Leadership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🟡 Intermediate</option>
                <option value="advanced">🔴 Advanced</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-primary-600">{filteredScenarios.length}</span> scenarios
              </div>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
          {filteredScenarios.map((scenario, index) => (
            <div 
              key={scenario.id} 
              className="card-hover group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-6">
                {/* Category badge and difficulty */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 bg-gradient-to-br ${getCategoryGradient(scenario.category)} rounded-xl flex items-center justify-center text-white text-xl shadow-soft`}>
                    {getCategoryEmoji(scenario.category)}
                  </div>
                  <span className={`badge difficulty-${scenario.difficulty}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                
                {/* Title and description */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {scenario.title}
                </h3>
                
                {scenario.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                )}
                
                {/* Character info */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">Character:</span>
                    <span className="text-gray-900">{scenario.character_name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-20">Role:</span>
                    <span className="text-gray-900">{scenario.character_role}</span>
                  </div>
                </div>
                
                {/* Action button */}
                <button
                  onClick={() => startSession(scenario)}
                  className="btn-primary w-full group-hover:shadow-glow transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🎙️</span>
                    Start Voice Session
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredScenarios.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No scenarios found</h3>
            <p className="text-gray-600 mb-6">
              No scenarios match your current filters. Try adjusting your search criteria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
