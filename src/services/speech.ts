// src/services/speech.ts

export class SpeechService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices();
    };

    updateVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = updateVoices;
    }
  }

  // Check browser support
  isSupported(): { recognition: boolean; synthesis: boolean } {
    return {
      recognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      synthesis: 'speechSynthesis' in window
    };
  }

  // Start speech recognition
  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): void {
    const support = this.isSupported();
    if (!support.recognition) {
      onError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    this.stopListening();

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;
        
        // Only process results with decent confidence
        if (confidence > 0.3 || isFinal) {
          onResult(transcript, isFinal);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error occurred.';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your microphone.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError('Failed to start speech recognition.');
    }
  }

  // Stop speech recognition
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  // Text-to-speech
  speak(text: string, characterGender: 'male' | 'female' = 'female'): Promise<void> {
    return new Promise((resolve, reject) => {
      const support = this.isSupported();
      if (!support.synthesis) {
        reject(new Error('Speech synthesis not supported.'));
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find appropriate voice
      const voice = this.findBestVoice(characterGender);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  // Stop speech
  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  // Find best voice for character
  private findBestVoice(gender: 'male' | 'female'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-')
    );

    if (englishVoices.length === 0) return null;

    // Look for gender-specific voices
    const genderVoices = englishVoices.filter(voice => {
      const name = voice.name.toLowerCase();
      if (gender === 'female') {
        return name.includes('female') || 
               name.includes('zira') || 
               name.includes('samantha') ||
               name.includes('karen') ||
               name.includes('susan');
      } else {
        return name.includes('male') || 
               name.includes('david') || 
               name.includes('mark') ||
               name.includes('tom');
      }
    });

    return genderVoices[0] || englishVoices[0];
  }

  // Get debug info
  getDebugInfo(): any {
    const support = this.isSupported();
    return {
      recognition: support.recognition,
      synthesis: support.synthesis,
      voicesCount: this.voices.length,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
    };
  }
}

export const speechService = new SpeechService();
