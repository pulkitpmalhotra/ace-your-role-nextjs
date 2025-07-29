// New service: src/services/googleSpeech.js
import { SpeechClient } from '@google-cloud/speech';

class GoogleSpeechService {
  constructor() {
    this.speechClient = new SpeechClient({
      keyFilename: process.env.GOOGLE_SPEECH_KEY_PATH,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }

  async transcribeAudio(audioBuffer) {
    const request = {
      audio: { content: audioBuffer },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'latest_long',
        useEnhanced: true,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true
      }
    };

    const [response] = await this.speechClient.recognize(request);
    return response.results[0]?.alternatives[0]?.transcript;
  }
}
// Enhanced TTS with emotional voices
class GoogleTTSService {
  async speak(text, characterData) {
    const request = {
      input: { text },
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

    const [response] = await this.ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  }
}
