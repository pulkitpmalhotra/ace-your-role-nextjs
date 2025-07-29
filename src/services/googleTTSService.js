class GoogleTTSService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  async initializeClient() {
    if (process.env.GOOGLE_SPEECH_ENABLED === 'true') {
      this.client = new textToSpeech.TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    }
  }

  async synthesizeWithEmotion(text, characterData) {
    if (!this.client) {
      throw new Error('Google TTS not available');
    }

    const emotionalSSML = this.addEmotionalSSML(text, characterData.emotion);
    
    const request = {
      input: { ssml: emotionalSSML },
      voice: {
        languageCode: 'en-US',
        name: this.selectVoice(characterData),
        ssmlGender: characterData.gender === 'female' ? 'FEMALE' : 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: this.getEmotionalRate(characterData.emotion),
        pitch: this.getEmotionalPitch(characterData.emotion),
        volumeGainDb: 0,
        effectsProfileId: ['telephony-class-application']
      }
    };

    const [response] = await this.client.synthesizeSpeech(request);
    return response.audioContent;
  }

  addEmotionalSSML(text, emotion) {
    const emotionTags = {
      curious: '<prosody rate="medium" pitch="+2st">',
      interested: '<prosody rate="fast" pitch="+1st">',
      concerned: '<prosody rate="slow" pitch="-1st">',
      skeptical: '<prosody rate="slow" pitch="-2st">',
      professional: '<prosody rate="medium" pitch="0st">',
      engaged: '<prosody rate="fast" pitch="+3st">'
    };

    const openTag = emotionTags[emotion] || emotionTags.professional;
    return `<speak>${openTag}${text}</prosody></speak>`;
  }
}
// ADD to GoogleTTSService class:
class AdvancedVoiceService {
  async createCharacterVoice(scenario) {
    const personality = await this.analyzeCharacterPersonality(scenario);
    
    return {
      baseVoice: this.selectBaseVoice(personality),
      emotionalRange: this.defineEmotionalRange(personality),
      speechPatterns: this.createSpeechPatterns(scenario.character_role),
      industryTerminology: this.loadIndustryTerms(scenario.category)
    };
  }

  async generateContextualSpeech(text, context) {
    // Add natural pauses based on conversation flow
    const enhancedText = this.addContextualPauses(text, context);
    
    // Apply role-specific speech patterns
    const roleAdjusted = this.applyRolePatterns(enhancedText, context.role);
    
    // Generate with full context
    return await this.synthesizeWithEmotion(roleAdjusted, context);
  }

  addContextualPauses(text, context) {
    // Add strategic pauses for natural conversation flow
    if (context.messageCount === 0) {
      // First message - add welcoming pause
      return text.replace(/^/, '<break time="0.5s"/>');
    }
    
    if (context.emotion === 'concerned') {
      // Add thoughtful pauses
      return text.replace(/\b(but|however|although)\b/g, '<break time="0.3s"/>$1<break time="0.3s"/>');
    }
    
    return text;
  }
}
export const googleTTSService = new GoogleTTSService();
