// app/api/speech/to-speech/route.ts - TypeScript safe version
export async function POST(request: Request) {
  try {
    const { text, character, emotion, gender } = await request.json();
    
    if (!text) {
      return Response.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    // Voice selection based on character and emotion
    const voiceConfig = selectVoice(character, gender, emotion);
    
    // For now, return a mock audio URL
    const mockAudioUrl = generateMockAudio(text, voiceConfig);

    console.log('🔊 Text-to-Speech generated:', {
      text: text.substring(0, 50) + '...',
      voice: voiceConfig.name,
      emotion
    });

    return Response.json({
      success: true,
      data: {
        audioUrl: mockAudioUrl,
        voice: voiceConfig,
        text,
        duration: estimateAudioDuration(text),
        model: 'google-cloud-tts'
      }
    });

  } catch (error) {
    console.error('Text-to-Speech API error:', error);
    return Response.json(
      { success: false, error: 'Speech synthesis failed' },
      { status: 500 }
    );
  }
}

interface VoiceConfig {
  name: string;
  speed: number;
  pitch: number;
}

function selectVoice(character: string, gender: string, emotion: string): VoiceConfig {
  // Default voice configuration
  const defaultVoice: VoiceConfig = {
    name: 'en-US-Journey-F',
    speed: 1.0,
    pitch: 0
  };

  // Voice mapping with proper typing
  const voiceMap: Record<string, Record<string, VoiceConfig>> = {
    'female-professional': { name: 'en-US-Journey-F', speed: 1.0, pitch: 0 },
    'female-curious': { name: 'en-US-Journey-F', speed: 1.1, pitch: 2 },
    'female-interested': { name: 'en-US-Journey-F', speed: 1.0, pitch: 1 },
    'female-engaged': { name: 'en-US-Journey-F', speed: 0.95, pitch: 1 },
    'female-collaborative': { name: 'en-US-Journey-F', speed: 0.9, pitch: 0 },
    'male-professional': { name: 'en-US-Journey-M', speed: 1.0, pitch: 0 },
    'male-curious': { name: 'en-US-Journey-M', speed: 1.1, pitch: 1 },
    'male-interested': { name: 'en-US-Journey-M', speed: 1.0, pitch: 1 },
    'male-engaged': { name: 'en-US-Journey-M', speed: 0.95, pitch: 0 },
    'male-collaborative': { name: 'en-US-Journey-M', speed: 0.9, pitch: -1 }
  };

  // Safe gender and emotion handling
  const safeGender = gender === 'female' ? 'female' : 'male';
  const safeEmotion = ['professional', 'curious', 'interested', 'engaged', 'collaborative'].includes(emotion) 
    ? emotion 
    : 'professional';

  const voiceKey = `${safeGender}-${safeEmotion}`;
  return voiceMap[voiceKey] || defaultVoice;
}

function generateMockAudio(text: string, voiceConfig: VoiceConfig): string {
  // Return a mock audio URL - in production this would be actual audio
  return `data:audio/mp3;base64,mock-audio-${encodeURIComponent(text.substring(0, 20))}-${voiceConfig.name}`;
}

function estimateAudioDuration(text: string): number {
  // Estimate audio duration based on text length (average speaking rate: 150 words/minute)
  const wordCount = text.split(' ').length;
  const wordsPerMinute = 150;
  return Math.ceil((wordCount / wordsPerMinute) * 60); // Return duration in seconds
}
