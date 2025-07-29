// src/services/speech.js - Enhanced with emotional and natural voice synthesis

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isListening = false;
    this.isSpeaking = false;
    this.isProcessing = false;
    this.loadVoices();
  }

  loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices();
      console.log('🔊 Available voices loaded:', this.voices.length);
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

    if (this.isSpeaking || this.isProcessing) {
      console.log('🔇 Not starting microphone - AI is currently speaking or processing');
      return;
    }

    this.stopListening();

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    let silenceTimer = null;
    let hasSpoken = false;
    let lastTranscript = '';

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully');
      this.isListening = true;
      clearTimeout(silenceTimer);
      hasSpoken = false;
      lastTranscript = '';
    };

    this.recognition.onresult = (event) => {
      if (this.isSpeaking || this.isProcessing) {
        console.log('🔇 Ignoring speech input - AI is speaking or processing');
        return;
      }

      hasSpoken = true;
      clearTimeout(silenceTimer);
      
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

      if (finalTranscript.trim() && finalTranscript.trim() !== lastTranscript.trim()) {
        console.log('✅ Final transcript:', finalTranscript);
        lastTranscript = finalTranscript.trim();
        this.isProcessing = true;
        this.stopListening();
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim() && !this.isSpeaking && !this.isProcessing) {
        onResult(interimTranscript.trim(), false);
        
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (interimTranscript.trim().length > 2 && !this.isSpeaking && !this.isProcessing) {
            console.log('⏰ Silence timeout - treating interim as final');
            lastTranscript = interimTranscript.trim();
            this.isProcessing = true;
            this.stopListening();
            onResult(interimTranscript.trim(), true);
          }
        }, 2000);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🚨 Speech recognition error:', event.error);
      this.isListening = false;
      clearTimeout(silenceTimer);
      
      switch (event.error) {
        case 'not-allowed':
          onError('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'no-speech':
          console.log('⚠️ No speech detected - this is normal, will restart');
          if (!this.isSpeaking && !this.isProcessing) {
            setTimeout(() => {
              if (!this.isListening && !this.isSpeaking && !this.isProcessing) {
                this.startListening(onResult, onError, onEnd);
              }
            }, 1000);
          }
          return;
        case 'audio-capture':
          onError('Microphone not found. Please check your microphone connection.');
          break;
        case 'network':
          onError('Network error. Please check your internet connection.');
          break;
        case 'aborted':
          console.log('ℹ️ Speech recognition aborted - this is normal');
          return;
        default:
          onError(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      this.isListening = false;
      clearTimeout(silenceTimer);
      
      if (!hasSpoken && !this.isSpeaking && !this.isProcessing) {
        setTimeout(() => {
          if (!this.isSpeaking && !this.isProcessing) {
            onEnd();
          }
        }, 500);
      }
    };

    try {
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

  // Enhanced text-to-speech with emotional parameters
  speak(text, characterData = {}) {
    return new Promise((resolve, reject) => {
      const support = this.isSupported();
      if (!support.synthesis) {
        reject(new Error('Speech synthesis not supported.'));
        return;
      }

      this.isSpeaking = true;
      this.stopListening();
      this.synthesis.cancel();

      console.log('🔊 AI starting to speak - microphone OFF');

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice selection and parameters
      const voiceConfig = this.getEnhancedVoiceConfig(characterData);
      
      if (voiceConfig.voice) {
        utterance.voice = voiceConfig.voice;
      }

      // Apply emotional speech parameters
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = voiceConfig.volume;

      // Add natural pauses and emphasis
      const processedText = this.addNaturalSpeechPatterns(text, characterData.emotion);
      utterance.text = processedText;

      utterance.onstart = () => {
        console.log('🔊 AI speech started with voice:', utterance.voice?.name || 'default');
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        console.log('🔊 AI speech completed - microphone can restart');
        this.isSpeaking = false;
        this.isProcessing = false;
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event);
        this.isSpeaking = false;
        this.isProcessing = false;
        
        if (event.error === 'interrupted') {
          console.log('ℹ️ Speech was interrupted - this is normal');
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      console.log('🔊 Starting emotional speech synthesis:', {
        text: text.substring(0, 50) + '...',
        emotion: characterData.emotion,
        gender: characterData.gender,
        voice: voiceConfig.voice?.name,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch
      });

      this.synthesis.speak(utterance);
    });
  }

  // Enhanced voice configuration based on character data
  getEnhancedVoiceConfig(characterData = {}) {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    const gender = characterData.gender || 'neutral';
    const emotion = characterData.emotion || 'professional';
    
    // Find the best voice for the character
    const voice = this.findOptimalVoice(gender, characterData.character_name);
    
    // Get emotional speech parameters
    const emotionalParams = this.getEmotionalSpeechParams(emotion);
    
    return {
      voice: voice,
      rate: emotionalParams.rate,
      pitch: emotionalParams.pitch,
      volume: emotionalParams.volume
    };
  }

  // Find the most suitable voice
  findOptimalVoice(gender, characterName = '') {
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') && voice.localService !== false
    );

    if (englishVoices.length === 0) {
      return this.voices.find(voice => voice.lang.startsWith('en-')) || null;
    }

    // Premium voice preferences (if available)
    const premiumVoices = englishVoices.filter(voice => {
      const name = voice.name.toLowerCase();
      return name.includes('enhanced') || 
             name.includes('premium') || 
             name.includes('neural') ||
             name.includes('natural');
    });

    let targetVoices = premiumVoices.length > 0 ? premiumVoices : englishVoices;

    // Gender-specific voice selection
    if (gender === 'female') {
      const femaleVoices = targetVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || 
               name.includes('woman') ||
               name.includes('samantha') ||
               name.includes('karen') ||
               name.includes('susan') ||
               name.includes('victoria') ||
               name.includes('zira') ||
               name.includes('hazel') ||
               name.includes('monica') ||
               name.includes('paulina') ||
               voice.name.match(/\b(sara|sarah|emily|anna|kate|amy|lisa|mary)\b/i);
      });
      
      if (femaleVoices.length > 0) {
        // Prefer more natural sounding female voices
        const naturalFemale = femaleVoices.find(voice => 
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('natural')
        );
        return naturalFemale || femaleVoices[0];
      }
    } else if (gender === 'male') {
      const maleVoices = targetVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('male') || 
               name.includes('man') ||
               name.includes('david') ||
               name.includes('mark') ||
               name.includes('tom') ||
               name.includes('daniel') ||
               name.includes('alex') ||
               name.includes('james') ||
               name.includes('ryan') ||
               voice.name.match(/\b(john|mike|steve|chris|paul|kevin)\b/i);
      });
      
      if (maleVoices.length > 0) {
        // Prefer more natural sounding male voices
        const naturalMale = maleVoices.find(voice => 
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('natural')
        );
        return naturalMale || maleVoices[0];
      }
    }

    // Fallback to best available English voice
    const bestVoice = targetVoices.find(voice => 
      voice.default || 
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('natural')
    );

    return bestVoice || targetVoices[0] || englishVoices[0] || null;
  }

  // Get speech parameters based on emotion
  getEmotionalSpeechParams(emotion) {
    const baseParams = {
      rate: 0.85,
      pitch: 1.0,
      volume: 0.9
    };

    switch (emotion) {
      case 'curious':
        return {
          rate: 0.9,   // Slightly faster, showing interest
          pitch: 1.1,  // Higher pitch for curiosity
          volume: 0.95
        };
        
      case 'interested':
        return {
          rate: 0.95,  // Energetic pace
          pitch: 1.05, // Slightly elevated
          volume: 0.95
        };
        
      case 'concerned':
        return {
          rate: 0.75,  // Slower, more thoughtful
          pitch: 0.95, // Slightly lower
          volume: 0.85
        };
        
      case 'skeptical':
        return {
          rate: 0.8,   // Deliberate pace
          pitch: 0.9,  // Lower, more serious
          volume: 0.9
        };
        
      case 'professional':
        return {
          rate: 0.85,  // Standard business pace
          pitch: 1.0,  // Neutral
          volume: 0.9
        };
        
      case 'warming_up':
        return {
          rate: 0.88,  // Slightly more relaxed
          pitch: 1.02, // Warmer tone
          volume: 0.92
        };
        
      case 'engaged':
        return {
          rate: 0.92,  // Active and engaged
          pitch: 1.08, // More animated
          volume: 0.95
        };
        
      default:
        return baseParams;
    }
  }

  // Add natural speech patterns and emphasis
  addNaturalSpeechPatterns(text, emotion = 'professional') {
    let processedText = text;
    
    // Add natural pauses for better pacing
    processedText = processedText.replace(/\./g, '. ');
    processedText = processedText.replace(/,/g, ', ');
    processedText = processedText.replace(/\?/g, '? ');
    processedText = processedText.replace(/!/g, '! ');
    
    // Add emphasis based on emotion
    switch (emotion) {
      case 'curious':
        processedText = processedText.replace(/\?/g, '?');
        break;
        
      case 'interested':
        // Add slight emphasis to positive words
        processedText = processedText.replace(/\b(great|excellent|perfect|wonderful|amazing)\b/gi, 
          (match) => `${match}`);
        break;
        
      case 'concerned':
        // Add pauses before important concerns
        processedText = processedText.replace(/\b(but|however|although|though)\b/gi, 
          (match) => ` ${match}`);
        break;
        
      case 'skeptical':
        // Add hesitation markers
        processedText = processedText.replace(/\b(really|actually|truly)\b/gi, 
          (match) => `${match}`);
        break;
    }
    
    // Clean up extra spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();
    
    return processedText;
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

  // State checking methods
  isCurrentlyListening() {
    return this.isListening;
  }

  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  getState() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isProcessing: this.isProcessing
    };
  }

  // Get debug info including voice capabilities
  getDebugInfo() {
    const support = this.isSupported();
    const availableVoices = this.voices.map(v => ({
      name: v.name,
      lang: v.lang,
      gender: this.guessVoiceGender(v.name),
      quality: v.localService ? 'local' : 'remote'
    }));

    return {
      recognition: support.recognition,
      synthesis: support.synthesis,
      voicesCount: this.voices.length,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isProcessing: this.isProcessing,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
      availableVoices: availableVoices,
      recommendedVoices: {
        female: availableVoices.filter(v => v.gender === 'female').slice(0, 3),
        male: availableVoices.filter(v => v.gender === 'male').slice(0, 3)
      }
    };
  }

  guessVoiceGender(voiceName) {
    const name = voiceName.toLowerCase();
    if (name.includes('female') || name.match(/\b(sara|sarah|emily|anna|kate|amy|lisa|mary|karen|susan|victoria|zira|hazel|monica|paulina)\b/)) {
      return 'female';
    }
    if (name.includes('male') || name.match(/\b(david|mark|tom|daniel|alex|james|ryan|john|mike|steve|chris|paul|kevin)\b/)) {
      return 'male';
    }
    return 'unknown';
  }
}

export const speechService = new SpeechService();
