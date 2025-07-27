// src/services/speech.js

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isListening = false;
    this.loadVoices();
  }

  loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices();
    };

    updateVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = updateVoices;
    }
  }

  // Check browser support
  isSupported() {
    return {
      recognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      synthesis: 'speechSynthesis' in window
    };
  }

  // Start speech recognition with better error handling
  startListening(onResult, onError, onEnd) {
    const support = this.isSupported();
    if (!support.recognition) {
      onError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    // Stop any existing recognition
    this.stopListening();

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Call onResult with the appropriate transcript
      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      let errorMessage = 'Speech recognition error occurred.';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your microphone connection.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          // Don't show error for aborted - usually intentional
          return;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      this.isListening = false;
      onEnd();
    };

    try {
      console.log('🎤 Starting speech recognition...');
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError('Failed to start speech recognition. Please try again.');
    }
  }

  // Stop speech recognition
  stopListening() {
    if (this.recognition && this.isListening) {
      console.log('🛑 Stopping speech recognition');
      this.recognition.stop();
      this.recognition = null;
      this.isListening = false;
    }
  }

  // Text-to-speech with better error handling
  speak(text, characterGender = 'female') {
    return new Promise((resolve, reject) => {
      const support = this.isSupported();
      if (!support.synthesis) {
        reject(new Error('Speech synthesis not supported.'));
        return;
      }

      // Cancel any ongoing speech
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

      utterance.onend = () => {
        console.log('🔊 Speech synthesis completed');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error(`Speech error: ${event.error}`));
      };

      console.log('🔊 Starting speech synthesis:', text.substring(0, 50) + '...');
      this.synthesis.speak(utterance);
    });
  }

  // Stop speech
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Check if currently listening
  isCurrentlyListening() {
    return this.isListening;
  }

  // Find best voice for character
  findBestVoice(gender) {
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
  getDebugInfo() {
    const support = this.isSupported();
    return {
      recognition: support.recognition,
      synthesis: support.synthesis,
      voicesCount: this.voices.length,
      isListening: this.isListening,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
    };
  }
}

export const speechService = new SpeechService();
