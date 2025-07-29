// /api/speech-to-text.js
import { SpeechClient } from '@google-cloud/speech';

const speechClient = new SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioData } = req.body;

  const request = {
    audio: {
      content: audioData,
    },
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      model: 'latest_long',
      useEnhanced: true,
      // Business terminology optimization
      speechContexts: [{
        phrases: [
          'ROI', 'KPI', 'SaaS', 'pipeline', 'stakeholder',
          'value proposition', 'pain points', 'use case'
        ],
        boost: 20
      }]
    },
  };

  try {
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => ({
        transcript: result.alternatives[0].transcript,
        confidence: result.alternatives[0].confidence,
        words: result.alternatives[0].words.map(word => ({
          word: word.word,
          startTime: word.startTime,
          endTime: word.endTime,
          confidence: word.confidence
        }))
      }));

    res.status(200).json({ transcription });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
