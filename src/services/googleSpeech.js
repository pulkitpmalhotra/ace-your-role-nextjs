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
