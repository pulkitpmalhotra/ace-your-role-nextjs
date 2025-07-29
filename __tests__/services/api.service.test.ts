// /__tests__/services/api.service.test.ts
import { apiService } from '@/services/api.service';
import { Scenario } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getScenarios', () => {
    it('fetches scenarios successfully', async () => {
      const mockScenarios: Scenario[] = [
        {
          id: '1',
          title: 'Test Scenario',
          character_name: 'Test Character',
          character_role: 'Test Role',
          difficulty: 'beginner',
          category: 'sales'
        }
      ];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockScenarios
      });
      
      const result = await apiService.getScenarios({ category: 'sales' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockScenarios);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scenarios?category=sales'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
    
    it('handles fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await apiService.getScenarios();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data).toBeUndefined();
    });
    
    it('handles HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await apiService.getScenarios();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error! status: 404');
    });
  });
  
  describe('transcribeAudio', () => {
    it('converts blob to base64 and sends to API', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/webm' });
      const mockTranscription = {
        transcript: 'Hello world',
        confidence: 0.95
      };
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: null,
        result: 'data:audio/webm;base64,dGVzdCBhdWRpbw=='
      };
      
      global.FileReader = jest.fn(() => mockFileReader) as any;
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranscription
      });
      
      // Trigger FileReader
      setTimeout(() => {
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend({} as any);
        }
      }, 0);
      
      const result = await apiService.transcribeAudio(mockBlob);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTranscription);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/speech-to-text'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('dGVzdCBhdWRpbw==')
        })
      );
    });
  });
});
