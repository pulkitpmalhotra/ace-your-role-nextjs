// /api/text-to-speech.js
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const ttsClient = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

export default async function handler(req, res) {
  const { text, emotion, scenario } = req.body;
  
  // Select voice based on character
  const voiceConfig = getVoiceForCharacter(scenario);
  
  // Add emotional SSML
  const ssmlText = addEmotionalSSML(text, emotion);
  
  const request = {
    input: { ssml: ssmlText },
    voice: {
      languageCode: 'en-US',
      name: voiceConfig.name,
      ssmlGender: voiceConfig.gender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volumeGainDb: 0,
      sampleRateHertz: 24000,
      effectsProfileId: ['headphone-class-device']
    }
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    res.status(200).json({ 
      audioContent: response.audioContent.toString('base64')
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
}

function addEmotionalSSML(text, emotion) {
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
