// src/services/api.js

class APIService {
  constructor() {
    // Hardcode your Vercel domain for now
    this.baseUrl = 'https://ai-roleplay-free.vercel.app';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🚀 Making API request to:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('💥 API Request failed:', error);
      console.error('🔗 URL was:', url);
      throw error;
    }
  }

  // Scenarios
  async getScenarios() {
    console.log('📚 Fetching scenarios...');
    return await this.makeRequest('/api/scenarios');
  }

  // Sessions
  async createSession(scenarioId, userEmail) {
    console.log('🎬 Creating session...');
    const data = await this.makeRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        scenarioId,
        userEmail
      })
    });
    return data.sessionId;
  }

  async updateSessionConversation(sessionId, conversation) {
    console.log('💬 Updating conversation...');
    await this.makeRequest('/api/sessions', {
      method: 'PUT',
      body: JSON.stringify({
        sessionId,
        conversation
      })
    });
  }

  async endSession(sessionId, feedback, durationMinutes) {
    console.log('🏁 Ending session...');
    await this.makeRequest('/api/sessions', {
      method: 'PUT',
      body: JSON.stringify({
        sessionId,
        feedback,
        durationMinutes,
        endSession: true
      })
    });
  }

  async getUserSessions(userEmail) {
    console.log('📋 Fetching user sessions...');
    return await this.makeRequest(`/api/sessions?userEmail=${encodeURIComponent(userEmail)}`);
  }

  // AI Chat
  async generateAIResponse(scenarioId, userMessage, conversationHistory) {
    console.log('🤖 Generating AI response...');
    return await this.makeRequest('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        scenarioId,
        userMessage,
        conversationHistory
      })
    });
  }
}

export const apiService = new APIService();
