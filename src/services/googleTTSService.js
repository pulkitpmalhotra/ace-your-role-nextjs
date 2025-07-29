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

export const googleTTSService = new GoogleTTSService();
