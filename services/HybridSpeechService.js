// /services/HybridSpeechService.js
class HybridSpeechService {
  constructor() {
    this.googleSpeech = new GoogleSpeechService();
    this.webSpeech = new WebSpeechService(); // existing service
    this.useGoogle = process.env.GOOGLE_SPEECH_ENABLED === 'true';
  }

  async transcribe(audioData) {
    try {
      if (this.useGoogle) {
        const result = await this.googleSpeech.transcribeRealTime(audioData);
        if (result.confidence > 0.8) {
          return result;
        }
        console.log('Low confidence, falling back to Web Speech API');
      }
      
      // Fallback to Web Speech API
      return await this.webSpeech.transcribe(audioData);
    } catch (error) {
      console.error('Google Speech failed, using Web Speech fallback:', error);
      return await this.webSpeech.transcribe(audioData);
    }
  }
}

// Update your recording component
const handleTranscription = async (audioBlob) => {
  const hybridService = new HybridSpeechService();
  const result = await hybridService.transcribe(audioBlob);
  
  if (result.confidence < 0.7) {
    setWarning('Audio quality may be low. Please speak clearly.');
  }
  
  return result.transcript;
};
