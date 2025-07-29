import { apiService } from '../../services/api';
import { Scenario, Session, ConversationMessage } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('APIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue('test@example.com');
  });

  describe('getScenariosWithFilters', () => {
    it('fetches scenarios with filters', async () => {
      const mockScenarios: Scenario[] = [
        {
          id: '1',
          title: 'Test Scenario',
          description: 'Test description',
          character_name: 'Test Character',
          character_role: 'Test Role',
          character_personality: 'Test personality',
          difficulty: 'beginner',
          category: 'sales',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockScenarios,
          meta: { total: 1 }
        })
      } as Response);

      const result = await apiService.getScenariosWithFilters({
        category: 'sales',
        difficulty: 'beginner'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ai-roleplay-free.vercel.app/api/scenarios?category=sales&difficulty=beginner',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-Email': 'test@example.com'
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockScenarios);
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      } as Response);

      await expect(apiService.getScenariosWithFilters()).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });
  });

  describe('createSession', () => {
    it('creates a new session', async () => {
      const mockSessionId = 'session-123';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sessionId: mockSessionId }
        })
      } as Response);

      const result = await apiService.createSession('scenario-123', 'test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ai-roleplay-free.vercel.app/api/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            scenarioId: 'scenario-123',
            userEmail: 'test@example.com'
          })
        })
      );

      expect(result).toBe(mockSessionId);
    });
  });

  describe('updateSessionConversation', () => {
    it('updates session conversation', async () => {
      const conversation: ConversationMessage[] = [
        {
          speaker: 'user',
          message: 'Hello',
          timestamp: Date.now()
        },
        {
          speaker: 'ai',
          message: 'Hi there!',
          timestamp: Date.now()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Session updated successfully' }
        })
      } as Response);

      await apiService.updateSessionConversation('session-123', conversation);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ai-roleplay-free.vercel.app/api/sessions',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            sessionId: 'session-123',
            conversation
          })
        })
      );
    });

    it('validates conversation format', async () => {
      const invalidConversation = [
        {
          speaker: 'invalid',
          message: 'Hello'
          // missing timestamp
        }
      ] as ConversationMessage[];

      await expect(
        apiService.updateSessionConversation('session-123', invalidConversation)
      ).rejects.toThrow();
    });
  });

  describe('generateAIResponse', () => {
    it('generates AI response', async () => {
      const mockResponse = {
        response: 'Hello! How can I help you?',
        character: 'John Smith',
        emotion: 'professional',
        gender: 'male'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      } as Response);

      const result = await apiService.generateAIResponse(
        'scenario-123',
        'Hello',
        []
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://ai-roleplay-free.vercel.app/api/ai-chat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            scenarioId: 'scenario-123',
            userMessage: 'Hello',
            conversationHistory: []
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('validates input parameters', async () => {
      await expect(
        apiService.generateAIResponse('', 'Hello', [])
      ).rejects.toThrow('Scenario ID is required');

      await expect(
        apiService.generateAIResponse('scenario-123', '', [])
      ).rejects.toThrow('User message is required and must be a string');

      await expect(
        apiService.generateAIResponse('scenario-123', 'Hello', 'invalid' as any)
      ).rejects.toThrow('Conversation history must be an array');
    });
  });
});
