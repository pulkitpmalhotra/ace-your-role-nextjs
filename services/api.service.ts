// /services/api.service.ts
import { 
  Scenario, 
  Session, 
  User, 
  ApiResponse, 
  ScenarioFilters,
  TranscriptionResult,
  DetailedFeedback 
} from '@/types';

class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  private async request<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Scenario methods
  async getScenarios(filters?: ScenarioFilters): Promise<ApiResponse<Scenario[]>> {
    const queryParams = new URLSearchParams(filters as any).toString();
    return this.request<Scenario[]>(`/api/scenarios?${queryParams}`);
  }
  
  async getScenarioById(id: string): Promise<ApiResponse<Scenario>> {
    return this.request<Scenario>(`/api/scenarios/${id}`);
  }
  
  // Session methods
  async createSession(
    userEmail: string, 
    scenarioId: string
  ): Promise<ApiResponse<Session>> {
    return this.request<Session>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ userEmail, scenarioId }),
    });
  }
  
  async updateSession(
    sessionId: string, 
    updates: Partial<Session>
  ): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }
  
  async getUserSessions(
    userEmail: string, 
    limit?: number
  ): Promise<ApiResponse<Session[]>> {
    const queryParams = new URLSearchParams({ userEmail, limit: String(limit || 10) });
    return this.request<Session[]>(`/api/sessions?${queryParams}`);
  }
  
  // AI Chat methods
  async sendChatMessage(
    prompt: string,
    scenario: Scenario,
    conversationHistory: string
  ): Promise<ApiResponse<{ response: string; emotion?: string }>> {
    return this.request('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ 
        prompt, 
        scenario, 
        conversationHistory 
      }),
    });
  }
  
  // Speech methods
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse<TranscriptionResult>> {
    const base64Audio = await this.blobToBase64(audioBlob);
    
    return this.request<TranscriptionResult>('/api/speech-to-text', {
      method: 'POST',
      body: JSON.stringify({ audioData: base64Audio }),
    });
  }
  
  async synthesizeSpeech(
    text: string,
    emotion: string,
    scenario: Scenario
  ): Promise<ApiResponse<{ audioContent: string }>> {
    return this.request('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text, emotion, scenario }),
    });
  }
  
  // Feedback methods
  async generateFeedback(
    sessionId: string
  ): Promise<ApiResponse<DetailedFeedback>> {
    return this.request<DetailedFeedback>(`/api/feedback/${sessionId}`, {
      method: 'POST',
    });
  }
  
  // Helper methods
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:audio/webm;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
