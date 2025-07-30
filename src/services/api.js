class APIService {
  constructor() {
    // Replace with your actual Next.js Vercel URL
    this.baseUrl = 'https://your-nextjs-app.vercel.app';
    this.debug = true;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    if (this.debug) {
      console.log('🚀 API Request:', {
        url,
        method: options.method || 'GET',
        headers: options.headers
      });
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (this.debug) {
        console.log('✅ API Response:', data);
      }

      return data;

    } catch (error) {
      console.error('💥 API Request failed:', error);
      console.log('🔗 URL was:', url);
      throw error;
    }
  }

  // Updated scenarios method
  async getScenariosWithFilters(filters = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filters to query string
    if (filters.category && filters.category !== 'all') {
      queryParams.append('category', filters.category);
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      queryParams.append('difficulty', filters.difficulty);
    }
    if (filters.search) {
      queryParams.append('search', filters.search);
    }

    const endpoint = `/api/scenarios${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  // Keep your existing methods
  async createSession(userEmail, scenarioId) {
    // For now, create session locally
    return {
      success: true,
      data: {
        id: `session_${Date.now()}`,
        scenario_id: scenarioId,
        user_email: userEmail,
        start_time: new Date().toISOString(),
        conversation: []
      }
    };
  }

  async saveConversation(sessionId, conversation) {
    // For now, just return success
    console.log('💾 Saving conversation:', { sessionId, messageCount: conversation.length });
    return { success: true };
  }

  async getAIResponse(scenario, userMessage, conversationHistory) {
    // For now, return a simple response
    // We'll upgrade this to Gemini 2.5 in the next step
    const responses = [
      "That's interesting. Could you tell me more about your specific needs?",
      "I understand your concern. What would be most important to you in a solution?",
      "That makes sense. How are you currently handling this challenge?",
      "Good point. What timeline are you working with for this project?",
      "I see. What's been your experience with similar solutions in the past?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      success: true,
      data: {
        response: randomResponse,
        character: scenario.character_name,
        emotion: 'professional'
      }
    };
  }

  // Health check method
  async healthCheck() {
    return this.makeRequest('/api/health');
  }
}

export default new APIService();
