// src/services/api.js

class APIService {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  // Scenarios
  async getScenarios() {
    const response = await fetch(`${this.baseUrl}/api/scenarios`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch scenarios');
    }
    
    return data.data;
  }

  // Sessions
  async createSession(scenarioId, userEmail) {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        userEmail
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create session');
    }
    
    return data.data.sessionId;
  }

  async updateSessionConversation(sessionId, conversation) {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        conversation
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update session');
    }
  }

  async endSession(sessionId, feedback, durationMinutes) {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        feedback,
        durationMinutes,
        endSession: true
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to end session');
    }
  }

  async getUserSessions(userEmail) {
    const response = await fetch(`${this.baseUrl}/api/sessions?userEmail=${encodeURIComponent(userEmail)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch sessions');
    }
    
    return data.data;
  }

  // AI Chat
  async generateAIResponse(scenarioId, userMessage, conversationHistory) {
    const response = await fetch(`${this.baseUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        userMessage,
        conversationHistory
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate AI response');
    }
    
    return data.data;
  }
}

export const apiService = new APIService();
