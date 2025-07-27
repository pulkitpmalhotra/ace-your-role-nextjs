// src/services/api.js

class APIService {
  constructor() {
    this.baseUrl = 'https://ai-roleplay-free.vercel.app';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🚀 Making API request to:', url);
    console.log('📋 Request options:', options);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response text first to see what we're dealing with
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      if (!response.ok) {
        // Try to parse error details
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = errorJson.error || errorJson.message || responseText;
        } catch (e) {
          // If it's not JSON, use the raw text
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
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
    console.log('📋 Scenario ID:', scenarioId);
    console.log('📧 User email:', userEmail);
    
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
    console.log('🆔 Session ID:', sessionId);
    console.log('📝 Conversation length:', conversation.length);
    console.log('📄 Conversation data:', conversation);
    
    // Validate the conversation data
    if (!Array.isArray(conversation)) {
      throw new Error('Conversation must be an array');
    }
    
    // Validate each message
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      if (!msg.speaker || !msg.message || !msg.timestamp) {
        console.error(`❌ Invalid message at index ${i}:`, msg);
        throw new Error(`Invalid message format at index ${i}`);
      }
      if (!['user', 'ai'].includes(msg.speaker)) {
        console.error(`❌ Invalid speaker at index ${i}:`, msg.speaker);
        throw new Error(`Invalid speaker "${msg.speaker}" at index ${i}`);
      }
    }
    
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
    console.log('🆔 Scenario ID:', scenarioId);
    console.log('💬 User message:', userMessage);
    console.log('📚 History length:', conversationHistory.length);
    
    // Validate inputs
    if (!scenarioId) {
      throw new Error('Scenario ID is required');
    }
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('User message is required and must be a string');
    }
    if (!Array.isArray(conversationHistory)) {
      throw new Error('Conversation history must be an array');
    }
    
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
;
async getUserSessionsWithFeedback(userEmail) {
  console.log('📊 Fetching user sessions with feedback...');
  return await this.makeRequest(`/api/sessions/feedback?userEmail=${encodeURIComponent(userEmail)}`);
}

async getSessionFeedback(sessionId) {
  console.log('📋 Fetching session feedback...');
  return await this.makeRequest(`/api/sessions/${sessionId}/feedback`);
}

async triggerFeedbackAnalysis(sessionId, conversation, scenario) {
  console.log('🔬 Triggering feedback analysis...');
  return await this.makeRequest('/api/feedback-analysis', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      conversation,
      scenario
    })
  });
}
export const apiService = new APIService();
