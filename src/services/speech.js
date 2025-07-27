// src/services/speech.js - FIXED VERSION

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isListening = false;
    this.isSpeaking = false; // NEW: Track if AI is speaking
    this.isProcessing = false; // NEW: Track if processing user input
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

  // Start speech recognition with better configuration
  startListening(onResult, onError, onEnd) {
    const support = this.isSupported();
    if (!support.recognition) {
      onError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    // CRITICAL: Don't start listening if AI is speaking or processing
    if (this.isSpeaking) {
      console.log('🔇 Not starting microphone - AI is currently speaking');
      return;
    }

    if (this.isProcessing) {
      console.log('🔇 Not starting microphone - currently processing input');
      return;
    }

    // Stop any existing recognition
    this.stopListening();

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // More robust configuration
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Add these for better reliability
    if (this.recognition.serviceURI !== undefined) {
      this.recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
    }

    let silenceTimer = null;
    let hasSpoken = false;
    let lastTranscript = '';

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully');
      this.isListening = true;
      
      // Reset silence timer
      clearTimeout(silenceTimer);
      hasSpoken = false;
      lastTranscript = '';
    };

    this.recognition.onresult = (event) => {
      // CRITICAL: Ignore results if AI is speaking or processing
      if (this.isSpeaking || this.isProcessing) {
        console.log('🔇 Ignoring speech input - AI is speaking or processing');
        return;
      }

      console.log('📝 Speech result event received');
      hasSpoken = true;
      
      // Clear silence timer since we got speech
      clearTimeout(silenceTimer);
      
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        console.log(`📝 Transcript: "${transcript}", Final: ${result.isFinal}, Confidence: ${confidence}`);
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Call onResult with the appropriate transcript
      if (finalTranscript.trim() && finalTranscript.trim() !== lastTranscript.trim()) {
        console.log('✅ Final transcript:', finalTranscript);
        lastTranscript = finalTranscript.trim();
        
        // Set processing flag to prevent new input during AI response
        this.isProcessing = true;
        this.stopListening(); // Stop listening immediately
        
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim() && !this.isSpeaking && !this.isProcessing) {
        onResult(interimTranscript.trim(), false);
        
        // Set silence timer for interim results
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (interimTranscript.trim().length > 2 && !this.isSpeaking && !this.isProcessing) {
            console.log('⏰ Silence timeout - treating interim as final');
            lastTranscript = interimTranscript.trim();
            this.isProcessing = true;
            this.stopListening();
            onResult(interimTranscript.trim(), true);
          }
        }, 2000); // 2 seconds of silence
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🚨 Speech recognition error:', event.error);
      this.isListening = false;
      clearTimeout(silenceTimer);
      
      let errorMessage = 'Speech recognition error occurred.';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
          break;
        case 'no-speech':
          console.log('⚠️ No speech detected - this is normal, will restart');
          // Don't treat no-speech as an error, just restart if not speaking/processing
          if (!this.isSpeaking && !this.isProcessing) {
            setTimeout(() => {
              if (!this.isListening && !this.isSpeaking && !this.isProcessing) {
                console.log('🔄 Restarting after no-speech...');
                this.startListening(onResult, onError, onEnd);
              }
            }, 1000);
          }
          return;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your microphone connection.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'aborted':
          console.log('ℹ️ Speech recognition aborted - this is normal');
          return;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      this.isListening = false;
      clearTimeout(silenceTimer);
      
      // Only restart if we're not speaking, processing, and haven't spoken
      if (!hasSpoken && !this.isSpeaking && !this.isProcessing) {
        console.log('🔄 Recognition ended without speech, will restart...');
        setTimeout(() => {
          if (!this.isSpeaking && !this.isProcessing) {
            onEnd();
          }
        }, 500);
      }
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

  // Text-to-speech with better error handling and state management
  speak(text, characterGender = 'female') {
    return new Promise((resolve, reject) => {
      const support = this.isSupported();
      if (!support.synthesis) {
        reject(new Error('Speech synthesis not supported.'));
        return;
      }

      // CRITICAL: Set speaking flag and stop any listening
      this.isSpeaking = true;
      this.stopListening(); // Force stop listening
      
      // Cancel any ongoing speech
      this.synthesis.cancel();

      console.log('🔊 AI starting to speak - microphone OFF');

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find appropriate voice
      const voice = this.findBestVoice(characterGender);
      if (voice) {
        utterance.voice = voice;
      }

      // Better speech settings
      utterance.rate = 0.85;  // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      utterance.onstart = () => {
        console.log('🔊 AI speech started');
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        console.log('🔊 AI speech completed - microphone can restart');
        this.isSpeaking = false;
        this.isProcessing = false; // Clear processing flag
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event);
        this.isSpeaking = false;
        this.isProcessing = false; // Clear processing flag
        
        // Don't reject for interrupted errors (these are normal)
        if (event.error === 'interrupted') {
          console.log('ℹ️ Speech was interrupted - this is normal');
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      utterance.onpause = () => {
        console.log('⏸️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };

      console.log('🔊 Starting speech synthesis:', text.substring(0, 50) + '...');
      this.synthesis.speak(utterance);
    });
  }

  // Stop speech
  stopSpeaking() {
    if (this.synthesis) {
      console.log('🛑 Force stopping speech synthesis');
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.isProcessing = false;
    }
  }

  // Check if currently listening
  isCurrentlyListening() {
    return this.isListening;
  }

  // Check if currently speaking
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  // Check if currently processing
  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  // Get current state for debugging
  getState() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isProcessing: this.isProcessing
    };
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
               name.includes('susan') ||
               name.includes('alex'); // Alex is often female on some systems
      } else {
        return name.includes('male') || 
               name.includes('david') || 
               name.includes('mark') ||
               name.includes('tom') ||
               name.includes('daniel');
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
      isSpeaking: this.isSpeaking,
      isProcessing: this.isProcessing,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
      availableVoices: this.voices.map(v => ({ name: v.name, lang: v.lang }))
    };
  }
}

export const speechService = new SpeechService();
