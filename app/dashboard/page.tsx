'use client';

import { useState, useEffect, useRef } from 'react';
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

interface UserProgress {
  category: string;
  total_sessions: number;
  total_minutes: number;
  average_score: number;
  best_score: number;
  last_session_date: string;
}

interface ProgressSummary {
  total_categories: number;
  total_sessions: number;
  total_minutes: number;
  overall_average_score: number;
  best_category: UserProgress | null;
  days_active: number;
  streak_days: number;
}

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedView, setSelectedView] = useState<'scenarios' | 'progress'>('scenarios');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    initializeDashboard();
  }, [router]);

  const initializeDashboard = async () => {
    try {
      // Check if user is logged in
      const email = localStorage.getItem('userEmail');
      const name = localStorage.getItem('userName');
      
      if (!email) {
        console.log('❌ No user email found, redirecting to login');
        router.push('/');
        return;
      }

      console.log('✅ User found:', email);
      setUserEmail(email);
      setUserName(name || email.split('@')[0]);
      
      // Load dashboard data
      await loadData(email);
      
    } catch (err) {
      console.error('❌ Dashboard initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load dashboard. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const loadData = async (email?: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Use provided email or fall back to state
      const emailToUse = email || userEmail;
      
      // Validate email before making API calls
      if (!emailToUse || !emailToUse.includes('@')) {
        console.error('❌ Invalid email for API calls:', emailToUse);
        setError('Invalid user session. Please log in again.');
        setLoading(false);
        setTimeout(() => router.push('/'), 2000);
        return;
      }
      
      console.log('📊 Loading dashboard data for:', emailToUse);
      
      // Load scenarios first (always available)
      console.log('📚 Loading scenarios...');
      const scenariosResponse = await fetch('/api/scenarios');
      if (scenariosResponse.ok) {
        const scenariosData = await scenariosResponse.json();
        if (scenariosData.success) {
          setScenarios(scenariosData.data || []);
          console.log('✅ Loaded', scenariosData.data?.length || 0, 'scenarios');
        }
      } else {
        console.warn('⚠️ Failed to load scenarios:', scenariosResponse.status);
      }
      
      // Load user progress (may not exist for new users)
      console.log('📈 Loading user progress for:', emailToUse);
      const progressUrl = `/api/progress?user_email=${encodeURIComponent(emailToUse)}`;
      console.log('🔗 Progress API URL:', progressUrl);
      
      const progressResponse = await fetch(progressUrl);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.success) {
          setUserProgress(progressData.data.progress || []);
          setProgressSummary(progressData.data.summary);
          console.log('✅ Loaded progress for', progressData.data.progress?.length || 0, 'categories');
        } else {
          console.log('ℹ️ No progress data yet:', progressData.error);
          // This is normal for new users
          setUserProgress([]);
          setProgressSummary(null);
        }
      } else if (progressResponse.status === 400) {
        console.log('ℹ️ User progress not found - new user');
        setUserProgress([]);
        setProgressSummary(null);
      } else {
        console.warn('⚠️ Failed to load progress:', progressResponse.status);
        setUserProgress([]);
        setProgressSummary(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('Failed to load some data. The app should still work for starting new sessions.');
    } finally {
      setLoading(false);
    }
  };

  const startChat = (scenario: Scenario) => {
    if (!userEmail) {
      alert('Please refresh the page and log in again.');
      return;
    }
    
    console.log('🎯 Starting session with scenario:', scenario.title);
    localStorage.setItem('currentScenario', JSON.stringify(scenario));
    router.push(`/session/${scenario.id}`);
  };

  const viewAnalyticsDashboard = () => {
    router.push('/analytics');
  };

  const logout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentScenario');
    router.push('/');
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

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      'sales': 'Practice consultative selling, objection handling, and closing techniques',
      'healthcare': 'Develop patient communication, empathy, and medical explanation skills',
      'support': 'Master customer service, issue resolution, and satisfaction techniques',
      'legal': 'Practice client consultation, risk communication, and professional advice',
      'leadership': 'Develop team management, feedback delivery, and coaching skills'
    };
    return descriptions[category] || 'Professional communication practice';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Scenario Card Component
  const ScenarioCard = ({ scenario, onStartChat, getDifficultyColor }: {
    scenario: Scenario;
    onStartChat: (scenario: Scenario) => void;
    getDifficultyColor: (difficulty: string) => string;
  }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 hover:border-blue-200 flex-shrink-0 w-full">
      {/* Difficulty Badge */}
      <div className="flex justify-end mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
          {scenario.difficulty}
        </span>
      </div>
      
      {/* Title */}
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        {scenario.title}
      </h4>
      
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
      
      {/* Start Button */}
      <button
        onClick={() => onStartChat(scenario)}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Start Scenario
      </button>
    </div>
  );

  // Scenario Carousel Component
  const ScenarioCarousel = ({ scenarios, onStartChat, getDifficultyColor }: {
    scenarios: Scenario[];
    onStartChat: (scenario: Scenario) => void;
    getDifficultyColor: (difficulty: string) => string;
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(3);
    const carouselRef = useRef<HTMLDivElement>(null);
    
    // Update items per view based on screen size
    useEffect(() => {
      const updateItemsPerView = () => {
        if (window.innerWidth < 768) {
          setItemsPerView(1); // Mobile: 1 item
        } else if (window.innerWidth < 1024) {
          setItemsPerView(2); // Tablet: 2 items
        } else {
          setItemsPerView(3); // Desktop: 3 items
        }
      };

      updateItemsPerView();
      window.addEventListener('resize', updateItemsPerView);
      return () => window.removeEventListener('resize', updateItemsPerView);
    }, []);
    
    const maxIndex = Math.max(0, scenarios.length - itemsPerView);
    
    const scrollToIndex = (index: number) => {
      if (carouselRef.current) {
        const cardWidth = carouselRef.current.scrollWidth / scenarios.length;
        carouselRef.current.scrollTo({
          left: cardWidth * index,
          behavior: 'smooth'
        });
      }
    };

    const goToPrevious = () => {
      const newIndex = Math.max(0, currentIndex - 1);
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    };

    const goToNext = () => {
      const newIndex = Math.min(maxIndex, currentIndex + 1);
      setCurrentIndex(newIndex);
      scrollToIndex(newIndex);
    };

    // Get responsive width classes
    const getItemWidth = () => {
      if (itemsPerView === 1) return 'w-full';
      if (itemsPerView === 2) return 'w-1/2';
      return 'w-1/3';
    };

    return (
      <div className="relative">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>🎯</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {currentIndex + 1}-{Math.min(currentIndex + itemsPerView, scenarios.length)} of {scenarios.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous scenarios"
              >
                ←
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next scenarios"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          ref={carouselRef}
          className="carousel-container flex gap-4 overflow-x-auto scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {scenarios.map((scenario) => (
            <div 
              key={scenario.id} 
              className={`min-w-0 flex-shrink-0 ${getItemWidth()}`}
              style={{ 
                scrollSnapAlign: 'start',
                paddingRight: '1rem'
              }}
            >
              <ScenarioCard 
                scenario={scenario}
                onStartChat={onStartChat}
                getDifficultyColor={getDifficultyColor}
              />
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-4 space-x-1">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  scrollToIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={logout}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Sign Out & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
                <p className="text-sm text-gray-600">AI-powered conversation training</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Hi, {userName}!</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedView('scenarios')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'scenarios' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            🎯 Practice Scenarios ({scenarios.length})
          </button>
          <button
            onClick={() => setSelectedView('progress')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedView === 'progress' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            📈 My Progress ({userProgress.length} categories)
          </button>
        </div>

        {/* Scenarios View */}
        {selectedView === 'scenarios' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Choose a Conversation</h2>
              <p className="text-gray-600">Select a scenario below and start practicing with AI characters</p>
            </div>

            {scenarios.length > 0 ? (
              <div className="space-y-8">
                {/* Group scenarios by category and sort by difficulty */}
                {Object.entries(
                  scenarios.reduce((acc, scenario) => {
                    if (!acc[scenario.category]) {
                      acc[scenario.category] = [];
                    }
                    acc[scenario.category].push(scenario);
                    return acc;
                  }, {} as Record<string, Scenario[]>)
                ).map(([category, categoryScenarios]) => {
                  // Sort scenarios by difficulty: beginner → intermediate → advanced
                  const sortedScenarios = [...categoryScenarios].sort((a, b) => {
                    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
                    return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4) - 
                           (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4);
                  });

                  return (
                    <div key={category} className="space-y-4">
                      {/* Category Header */}
                      <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                        <div className="text-3xl">{getCategoryEmoji(category)}</div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 capitalize">{category}</h3>
                          <p className="text-sm text-gray-600">
                            {getCategoryDescription(category)} • {sortedScenarios.length} scenario{sortedScenarios.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Category Scenarios - Carousel if more than display limit, Grid if within limit */}
                      {sortedScenarios.length > 3 ? (
                        <ScenarioCarousel 
                          scenarios={sortedScenarios} 
                          onStartChat={startChat}
                          getDifficultyColor={getDifficultyColor}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sortedScenarios.map((scenario) => (
                            <ScenarioCard 
                              key={scenario.id}
                              scenario={scenario}
                              onStartChat={startChat}
                              getDifficultyColor={getDifficultyColor}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No scenarios available</h3>
                <p className="text-gray-600 mb-4">We're loading conversation scenarios...</p>
                <button
                  onClick={() => loadData(userEmail)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress View */}
        {selectedView === 'progress' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Progress Summary</h2>
                <p className="text-gray-600">Track your improvement across different skill areas</p>
              </div>
              {/* Single consolidated Analytics Dashboard button */}
              {userProgress.length > 0 && (
                <button
                  onClick={viewAnalyticsDashboard}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <span className="text-lg">📊</span>
                  <span>Analytics Dashboard</span>
                </button>
              )}
            </div>

            {userProgress.length > 0 ? (
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div key={progress.category} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCategoryEmoji(progress.category)}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">{progress.category}</h3>
                          <p className="text-sm text-gray-600">Last practiced: {formatDate(progress.last_session_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(progress.average_score)}`}>
                          {progress.average_score ? progress.average_score.toFixed(1) : '0.0'}/5.0
                        </div>
                        <div className="text-xs text-gray-600">Average Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{progress.total_sessions}</div>
                        <div className="text-xs text-gray-600">Sessions</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{progress.total_minutes}m</div>
                        <div className="text-xs text-gray-600">Time</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getScoreColor(progress.best_score)}`}>
                          {progress.best_score ? progress.best_score.toFixed(1) : '0.0'}
                        </div>
                        <div className="text-xs text-gray-600">Best Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No progress data yet</h3>
                <p className="text-gray-600 mb-6">Complete your first conversation to start tracking progress</p>
                <button
                  onClick={() => setSelectedView('scenarios')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Start Your First Session
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
