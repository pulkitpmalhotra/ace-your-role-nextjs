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
// ADD to existing SpeechService class:
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
    } catch (error) {
      console.error('Google Speech failed, using Web Speech fallback:', error);
    }

    // Fallback to Web Speech API
    return await this.webSpeech.transcribe(audioData);
  }
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

    console.log('🔊 Looking for voice - Gender:', gender, 'Character:', characterName);
    console.log('🔊 Available voices:', englishVoices.map(v => ({ name: v.name, gender: this.guessVoiceGender(v.name) })));

    // Gender-specific voice selection with better matching
    if (gender === 'female') {
      const femaleVoices = englishVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        const guessedGender = this.guessVoiceGender(voice.name);
        
        // Priority matching: explicit female indicators first
        return guessedGender === 'female' || 
               name.includes('female') || 
               name.includes('woman') ||
               // Common female voice names
               name.includes('zira') ||
               name.includes('hazel') ||
               name.includes('susan') ||
               name.includes('karen') ||
               name.includes('samantha') ||
               name.includes('victoria') ||
               name.includes('alex') || // Alex can be female on some systems
               name.includes('monica') ||
               name.includes('paulina') ||
               // Pattern matching for female names
               name.match(/\b(sara|sarah|emily|anna|kate|amy|lisa|mary|jennifer|jessica|rachel|melissa|stephanie|nicole|amanda|michelle|angela|heather|maria|jennifer)\b/i);
      });
      
      console.log('🚺 Female voices found:', femaleVoices.map(v => v.name));
      
      if (femaleVoices.length > 0) {
        // Prefer enhanced/natural voices
        const enhancedFemale = femaleVoices.find(voice => 
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('natural') ||
          voice.name.toLowerCase().includes('premium')
        );
        
        const selectedVoice = enhancedFemale || femaleVoices[0];
        console.log('✅ Selected female voice:', selectedVoice.name);
        return selectedVoice;
      }
    } else if (gender === 'male') {
      const maleVoices = englishVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        const guessedGender = this.guessVoiceGender(voice.name);
        
        // Priority matching: explicit male indicators first
        return guessedGender === 'male' || 
               name.includes('male') || 
               name.includes('man') ||
               // Common male voice names
               name.includes('david') ||
               name.includes('mark') ||
               name.includes('tom') ||
               name.includes('daniel') ||
               name.includes('james') ||
               name.includes('ryan') ||
               name.includes('kevin') ||
               name.includes('george') ||
               // Pattern matching for male names
               name.match(/\b(john|mike|steve|chris|paul|robert|michael|william|richard|charles|joseph|thomas|christopher|matthew|anthony|donald|andrew|joshua|kenneth|brian|edward|ronald|timothy|jason|jeffrey|gary|nicholas|eric|jonathan|stephen|larry|justin|scott|brandon|benjamin|samuel|frank|gregory|raymond|alexander|patrick|jack|dennis|jerry)\b/i);
      });
      
      console.log('🚹 Male voices found:', maleVoices.map(v => v.name));
      
      if (maleVoices.length > 0) {
        // Prefer enhanced/natural voices
        const enhancedMale = maleVoices.find(voice => 
          voice.name.toLowerCase().includes('enhanced') ||
          voice.name.toLowerCase().includes('natural') ||
          voice.name.toLowerCase().includes('premium')
        );
        
        const selectedVoice = enhancedMale || maleVoices[0];
        console.log('✅ Selected male voice:', selectedVoice.name);
        return selectedVoice;
      }
    }

    // Fallback to best available English voice
    console.log('⚠️ No gender-specific voice found, using fallback');
    const bestVoice = englishVoices.find(voice => 
      voice.default || 
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('natural')
    );

    const fallbackVoice = bestVoice || englishVoices[0] || null;
    console.log('🔄 Fallback voice selected:', fallbackVoice?.name);
    return fallbackVoice;
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
    
    // Explicit gender indicators (highest priority)
    if (name.includes('female') || name.includes('woman')) return 'female';
    if (name.includes('male') && !name.includes('female')) return 'male';
    
    // Common female voice names and patterns
    const femalePatterns = [
      'zira', 'hazel', 'susan', 'karen', 'samantha', 'victoria', 'monica', 'paulina',
      'sara', 'sarah', 'emily', 'anna', 'kate', 'amy', 'lisa', 'mary', 'jennifer', 
      'jessica', 'rachel', 'melissa', 'stephanie', 'nicole', 'amanda', 'michelle', 
      'angela', 'heather', 'maria', 'julie', 'joyce', 'kelly', 'christina', 'joan', 
      'evelyn', 'judith', 'margaret', 'cheryl', 'andrea', 'hannah', 'megan', 'olivia', 
      'sophia', 'emma', 'isabella', 'ava', 'mia', 'abigail', 'elizabeth', 'chloe'
    ];
    
    // Common male voice names and patterns
    const malePatterns = [
      'david', 'mark', 'tom', 'daniel', 'james', 'ryan', 'kevin', 'george',
      'john', 'mike', 'steve', 'chris', 'paul', 'robert', 'michael', 'william',
      'richard', 'charles', 'joseph', 'thomas', 'christopher', 'matthew', 'anthony',
      'donald', 'andrew', 'joshua', 'kenneth', 'brian', 'edward', 'ronald', 'timothy',
      'jason', 'jeffrey', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry',
      'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'frank', 'gregory', 'raymond',
      'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'henry'
    ];
    
    // Check for female patterns
    for (const pattern of femalePatterns) {
      if (name.includes(pattern)) return 'female';
    }
    
    // Check for male patterns
    for (const pattern of malePatterns) {
      if (name.includes(pattern)) return 'male';
    }
    
    // Special cases for ambiguous names
    if (name.includes('alex')) {
      // Alex can be either gender, but often female in TTS systems
      return 'female';
    }
    
    return 'unknown';
  }
}

export const speechService = new SpeechService();
