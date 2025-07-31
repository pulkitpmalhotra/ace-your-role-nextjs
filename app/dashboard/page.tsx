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
    // Check if user is logged in (simple email check)
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const getUserName = () => {
    return userEmail ? userEmail.split('@')[0] : 'User';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>🎯</span>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Ace Your Role</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>
                    {getUserName()[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>{getUserName()}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{userEmail}</p>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '32px 16px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Welcome back, {getUserName()}! 👋
          </h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Continue your AI-powered roleplay training with enhanced speech features and personalized feedback.
          </p>
        </div>

        {/* Feature Highlights */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px', 
          marginBottom: '32px' 
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>🤖</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Gemini 2.5 Flash-Lite</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>43% cost reduction with enhanced conversation quality</p>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>🎤</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Voice Conversations</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Natural speech-to-speech conversations with AI characters</p>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>📊</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Smart Feedback</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Personalized performance analysis and improvement suggestions</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '32px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Filter Scenarios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                <option value="sales">Sales</option>
                <option value="healthcare">Healthcare</option>
                <option value="support">Support</option>
                <option value="legal">Legal</option>
                <option value="leadership">Leadership</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredScenarios.map((scenario) => (
            <div 
              key={scenario.id} 
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                border: '1px solid #e5e7eb',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', marginRight: '8px' }}>{getCategoryEmoji(scenario.category)}</span>
                    <span className={getDifficultyColor(scenario.difficulty)} style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '500' 
                    }}>
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  {scenario.title}
                </h3>
                
                {scenario.description && (
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                    {scenario.description}
                  </p>
                )}
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500' }}>Character:</span>
                    <span style={{ marginLeft: '8px' }}>{scenario.character_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                    <span style={{ fontWeight: '500' }}>Role:</span>
                    <span style={{ marginLeft: '8px' }}>{scenario.character_role}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => startSession(scenario)}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                >
                  🎙️ Start Voice Session
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredScenarios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '16px' }}>No scenarios match your current filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
