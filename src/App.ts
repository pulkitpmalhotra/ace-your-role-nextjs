import React, { useState, useEffect } from 'react';
import './App.css';

interface TestResults {
  scenarios: boolean;
  sessions: boolean;
  aiChat: boolean;
}

function App() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    testAPIs();
  }, []);

  const testAPIs = async () => {
    const testResults: TestResults = {
      scenarios: false,
      sessions: false,
      aiChat: false
    };

    try {
      // Test scenarios API
      console.log('Testing scenarios API...');
      const scenariosResponse = await fetch('/api/scenarios');
      if (scenariosResponse.ok) {
        const scenariosData = await scenariosResponse.json();
        if (scenariosData.success && scenariosData.data) {
          testResults.scenarios = true;
          setScenarios(scenariosData.data);
          console.log('✅ Scenarios API working, found:', scenariosData.data.length, 'scenarios');
        }
      } else {
        console.error('❌ Scenarios API failed:', scenariosResponse.status);
      }

      // Test sessions API
      console.log('Testing sessions API...');
      const sessionsResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenarios[0]?.id || 'test-id',
          userEmail: 'test@example.com'
        })
      });
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          testResults.sessions = true;
          console.log('✅ Sessions API working');
        }
      } else {
        console.error('❌ Sessions API failed:', sessionsResponse.status);
      }

      // Test AI chat API
      console.log('Testing AI chat API...');
      const aiResponse = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenarios[0]?.id || 'test-id',
          userMessage: 'Hello, I would like to discuss your services.',
          conversationHistory: []
        })
      });
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.success && aiData.data?.response) {
          testResults.aiChat = true;
          console.log('✅ AI Chat API working, response:', aiData.data.response);
        }
      } else {
        console.error('❌ AI Chat API failed:', aiResponse.status);
      }

    } catch (error) {
      console.error('API test error:', error);
    }

    setResults(testResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🧪 Testing Vercel APIs...</h1>
        <p>Check console for detailed results...</p>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
    );
  }

  const allWorking = results && Object.values(results).every(Boolean);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎯 AI Roleplay Platform - Vercel Setup</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>API Test Results</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: results?.scenarios ? '#d4edda' : '#f8d7da',
            color: results?.scenarios ? '#155724' : '#721c24'
          }}>
            📊 Scenarios API: {results?.scenarios ? '✅ Working' : '❌ Failed'}
          </div>
          
          <div style={{ 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: results?.sessions ? '#d4edda' : '#f8d7da',
            color: results?.sessions ? '#155724' : '#721c24'
          }}>
            💾 Sessions API: {results?.sessions ? '✅ Working' : '❌ Failed'}
          </div>
          
          <div style={{ 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: results?.aiChat ? '#d4edda' : '#f8d7da',
            color: results?.aiChat ? '#155724' : '#721c24'
          }}>
            🤖 AI Chat API: {results?.aiChat ? '✅ Working' : '❌ Failed'}
          </div>
        </div>
      </div>

      {scenarios.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>Available Scenarios</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            {scenarios.map((scenario, index) => (
              <div key={scenario.id} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                  {scenario.title}
                </h3>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                  {scenario.description}
                </p>
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#888' }}>
                  <span><strong>Character:</strong> {scenario.character_name}</span>
                  <span><strong>Role:</strong> {scenario.character_role}</span>
                  <span><strong>Difficulty:</strong> {scenario.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: allWorking ? '#d4edda' : '#f8d7da',
        color: allWorking ? '#155724' : '#721c24',
        textAlign: 'center'
      }}>
        {allWorking ? (
          <div>
            <h2>🎉 All APIs Working!</h2>
            <p>Your Vercel setup is complete and ready for the UI components.</p>
          </div>
        ) : (
          <div>
            <h2>⚠️ Some APIs Need Fixing</h2>
            <p>Check the console and fix any failing APIs before continuing.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>Next Steps:</h3>
        <ul>
          <li>✅ Ensure all API tests pass</li>
          <li>🚀 Deploy to Vercel</li>
          <li>🎨 Build the UI components</li>
          <li>🎤 Add speech recognition</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
