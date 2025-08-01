// scripts/test-mvp.js - MVP functionality testing script
// Run with: node scripts/test-mvp.js

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

class MVPTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting MVP Testing Suite\n');

    // Health check
    await this.test('API Health Check', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      const data = await response.json();
      if (!data.status) throw new Error('Health check response missing status');
    });

    // Scenarios API
    await this.test('Scenarios API', async () => {
      const response = await fetch(`${BASE_URL}/api/scenarios`);
      if (!response.ok) throw new Error(`Scenarios API failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Scenarios API returned error');
      if (!Array.isArray(data.data)) throw new Error('Scenarios data is not an array');
      if (data.data.length === 0) throw new Error('No scenarios found');
    });

    // User creation
    await this.test('User Creation API', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, name: 'Test User' })
      });
      
      if (!response.ok) throw new Error(`User creation failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(`User creation error: ${data.error}`);
      if (!data.data.user.email) throw new Error('User email not returned');
    });

    // Session creation
    await this.test('Session Creation API', async () => {
      // First get a scenario
      const scenariosResponse = await fetch(`${BASE_URL}/api/scenarios`);
      const scenariosData = await scenariosResponse.json();
      const firstScenario = scenariosData.data[0];
      
      const testEmail = `session-test-${Date.now()}@example.com`;
      
      // Create user first
      await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, name: 'Session Test User' })
      });

      // Create session
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: firstScenario.id,
          user_email: testEmail
        })
      });
      
      if (!response.ok) throw new Error(`Session creation failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(`Session creation error: ${data.error}`);
      if (!data.data.id) throw new Error('Session ID not returned');
    });

    // AI Chat API
    await this.test('AI Chat API', async () => {
      // Get a scenario first
      const scenariosResponse = await fetch(`${BASE_URL}/api/scenarios`);
      const scenariosData = await scenariosResponse.json();
      const scenario = scenariosData.data[0];

      const response = await fetch(`${BASE_URL}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario,
          userMessage: "Hello, I'm interested in learning more about your solution.",
          conversationHistory: [],
          messageCount: 1,
          enhancedMode: true
        })
      });
      
      if (!response.ok) throw new Error(`AI Chat failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(`AI Chat error: ${data.error}`);
      if (!data.data.response) throw new Error('AI response not returned');
      if (data.data.response.length < 10) throw new Error('AI response too short');
    });

    // Speech APIs
    await this.test('Speech to Text API', async () => {
      const response = await fetch(`${BASE_URL}/api/speech/to-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: 'mock_audio_data',
          config: { languageCode: 'en-US' }
        })
      });
      
      if (!response.ok) throw new Error(`Speech to Text failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Speech to Text returned error');
      if (!data.data.transcript) throw new Error('No transcript returned');
    });

    await this.test('Text to Speech API', async () => {
      const response = await fetch(`${BASE_URL}/api/speech/to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello, this is a test message.",
          character: "Sarah Johnson",
          emotion: "professional",
          gender: "female"
        })
      });
      
      if (!response.ok) throw new Error(`Text to Speech failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Text to Speech returned error');
    });

    // Database connectivity
    await this.test('Database Connectivity', async () => {
      const testEmail = `db-test-${Date.now()}@example.com`;
      
      // Test user progress API (which tests database)
      const response = await fetch(`${BASE_URL}/api/progress?user_email=${encodeURIComponent(testEmail)}`);
      
      if (!response.ok) throw new Error(`Progress API failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Progress API returned error');
      // Empty progress is OK for new user
    });

    // Conversation Analysis
    await this.test('Conversation Analysis API', async () => {
      // Get a scenario first
      const scenariosResponse = await fetch(`${BASE_URL}/api/scenarios`);
      const scenariosData = await scenariosResponse.json();
      const scenario = scenariosData.data[0];

      const mockConversation = [
        { speaker: 'ai', message: 'Hello, how can I help you today?', timestamp: Date.now() - 60000 },
        { speaker: 'user', message: 'I am interested in your product.', timestamp: Date.now() - 30000 },
        { speaker: 'ai', message: 'Great! What specific features are you looking for?', timestamp: Date.now() }
      ];

      const response = await fetch(`${BASE_URL}/api/analyze-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: mockConversation,
          scenario: scenario,
          session_id: `test-session-${Date.now()}`
        })
      });
      
      if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error('Analysis returned error');
      if (!data.data.overall_score) throw new Error('No overall score returned');
    });

    // Print results
    console.log('\n📊 Testing Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%\n`);

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => console.log(`   - ${test.name}: ${test.error}`));
    }

    const isReady = this.results.failed === 0 && this.results.passed >= 8;
    console.log(`\n${isReady ? '🎉 MVP IS READY FOR TESTING!' : '⚠️ MVP needs fixes before testing'}`);
    
    return isReady;
  }
}

// Run tests
if (require.main === module) {
  const tester = new MVPTester();
  tester.runAllTests()
    .then(isReady => {
      process.exit(isReady ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner error:', error);
      process.exit(1);
    });
}

module.exports = MVPTester;
