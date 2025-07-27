// src/services/api.ts

export interface Scenario {
  id: string;
  title: string;
  description: string;
  character_name: string;
  character_role: string;
  character_personality: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export interface Session {
  id: string;
  scenario_id: string;
  user_email: string;
  start_time: string;
  end_time?: string;
  conversation: ConversationMessage[];
  feedback?: string;
  duration_minutes: number;
}

class APIService {
  private baseUrl = window.location.origin;

  // Scenarios
  async getScenarios(): Promise<Scenario[]> {
    const response = await fetch(`${this.baseUrl}/api/scenarios`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch scenarios');
    }
    
    return data.data;
  }

  // Sessions
  async createSession(scenarioId: string, userEmail: string): Promise<string> {
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

  async updateSessionConversation(sessionId: string, conversation: ConversationMessage[]): Promise<void> {
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

  async endSession(sessionId: string, feedback: string, durationMinutes: number): Promise<void> {
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

  async getUserSessions(userEmail: string): Promise<Session[]> {
    const response = await fetch(`${this.baseUrl}/api/sessions?userEmail=${encodeURIComponent(userEmail)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch sessions');
    }
    
    return data.data;
  }

  // AI Chat
  async generateAIResponse(
    scenarioId: string, 
    userMessage: string, 
    conversationHistory: ConversationMessage[]
  ): Promise<{ response: string; character: string }> {
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
