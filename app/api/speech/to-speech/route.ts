// app/api/speech/to-speech/route.ts - Enhanced character voices
export async function POST(request: Request) {
  try {
    const { text, character, emotion, gender } = await request.json();
    
    if (!text) {
      return Response.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('🔊 Generating character voice for:', character, emotion, gender);

    // Enhanced voice selection based on character traits
    const voiceConfig = selectCharacterVoice(character, gender, emotion);
    
    // Simulate advanced TTS processing
    const audioResult = await generateCharacterAudio(text, voiceConfig);

    return Response.json({
      success: true,
      data: {
        audioUrl: audioResult.audioUrl,
        voice: voiceConfig,
        text,
        duration: audioResult.duration,
        model: 'google-cloud-tts-enhanced',
        characterPersonality: voiceConfig.personality
      }
    });

  } catch (error) {
    console.error('❌ Text-to-Speech API error:', error);
    return Response.json(
      { success: false, error: 'Speech synthesis failed' },
      { status: 500 }
    );
  }
}

// Define emotion configuration interface
interface EmotionConfig {
  speed: number;
  pitch: number;
}

interface EmotionMap {
  professional: EmotionConfig;
  curious: EmotionConfig;
  engaged: EmotionConfig;
  concerned?: EmotionConfig;
  enthusiastic?: EmotionConfig;
  frustrated?: EmotionConfig;
  angry?: EmotionConfig;
  calming?: EmotionConfig;
  questioning?: EmotionConfig;
  defensive?: EmotionConfig;
  resistant?: EmotionConfig;
  collaborative?: EmotionConfig;
}

interface VoiceProfile {
  name: string;
  speed: number;
  pitch: number;
  personality: string;
  emotionMap: EmotionMap;
}

function selectCharacterVoice(character: string, gender: string, emotion: string) {
  // Advanced character voice mapping based on role and personality
  const characterVoices: Record<string, VoiceProfile> = {
    // Healthcare characters
    'Dr. Michael Chen': {
      name: 'en-US-Neural2-J',
      speed: 0.9,
      pitch: -2,
      personality: 'authoritative, caring, measured',
      emotionMap: {
        professional: { speed: 0.9, pitch: -2 },
        curious: { speed: 1.0, pitch: -1 },
        concerned: { speed: 0.8, pitch: -3 },
        engaged: { speed: 0.95, pitch: -1 }
      }
    },
    
    // Sales characters  
    'Sarah Johnson': {
      name: 'en-US-Neural2-F',
      speed: 1.1,
      pitch: 1,
      personality: 'confident, engaging, dynamic',
      emotionMap: {
        professional: { speed: 1.0, pitch: 1 },
        curious: { speed: 1.2, pitch: 2 },
        engaged: { speed: 1.1, pitch: 1 },
        enthusiastic: { speed: 1.3, pitch: 3 }
      }
    },

    // Support characters
    'Jennifer Williams': {
      name: 'en-US-Neural2-G',
      speed: 1.0,
      pitch: 2,
      personality: 'frustrated, impatient, direct',
      emotionMap: {
        professional: { speed: 1.0, pitch: 2 },
        frustrated: { speed: 1.2, pitch: 3 },
        angry: { speed: 1.3, pitch: 4 },
        calming: { speed: 0.9, pitch: 1 },
        curious: { speed: 1.1, pitch: 2 },
        engaged: { speed: 1.0, pitch: 2 }
      }
    },

    // Legal characters
    'Robert Martinez': {
      name: 'en-US-Neural2-D',
      speed: 0.85,
      pitch: -1,
      personality: 'cautious, detail-oriented, formal',
      emotionMap: {
        professional: { speed: 0.85, pitch: -1 },
        concerned: { speed: 0.8, pitch: -2 },
        questioning: { speed: 0.9, pitch: 0 },
        curious: { speed: 0.9, pitch: 0 },
        engaged: { speed: 0.88, pitch: -1 }
      }
    },

    // Leadership characters
    'Lisa Thompson': {
      name: 'en-US-Neural2-E',
      speed: 0.9,
      pitch: 0,
      personality: 'defensive, experienced, resistant',
      emotionMap: {
        professional: { speed: 0.9, pitch: 0 },
        defensive: { speed: 1.1, pitch: 1 },
        resistant: { speed: 0.8, pitch: -1 },
        collaborative: { speed: 0.95, pitch: 0 },
        curious: { speed: 0.95, pitch: 0 },
        engaged: { speed: 0.92, pitch: 0 }
      }
    }
  };

  // Get character-specific voice or fall back to gender-based selection
  let voiceProfile = characterVoices[character as keyof typeof characterVoices];
  
  if (!voiceProfile) {
    // Fallback to gender-based voice selection with complete emotion map
    voiceProfile = {
      name: gender === 'female' ? 'en-US-Neural2-F' : 'en-US-Neural2-D',
      speed: 1.0,
      pitch: 0,
      personality: 'professional, neutral',
      emotionMap: {
        professional: { speed: 1.0, pitch: 0 },
        curious: { speed: 1.1, pitch: 1 },
        engaged: { speed: 0.95, pitch: 0 },
        concerned: { speed: 0.9, pitch: -1 },
        enthusiastic: { speed: 1.2, pitch: 2 },
        frustrated: { speed: 1.1, pitch: 1 },
        angry: { speed: 1.2, pitch: 2 },
        calming: { speed: 0.9, pitch: -1 },
        questioning: { speed: 1.0, pitch: 1 },
        defensive: { speed: 1.0, pitch: 0 },
        resistant: { speed: 0.9, pitch: -1 },
        collaborative: { speed: 1.0, pitch: 0 }
      }
    };
  }

  // Apply emotion-specific adjustments
  const emotionConfig = voiceProfile.emotionMap[emotion as keyof EmotionMap] || 
                       voiceProfile.emotionMap.professional;
  
  return {
    name: voiceProfile.name,
    speed: emotionConfig.speed || voiceProfile.speed,
    pitch: emotionConfig.pitch || voiceProfile.pitch,
    personality: voiceProfile.personality,
    emotion: emotion
  };
}

async function generateCharacterAudio(text: string, voiceConfig: any) {
  // Simulate processing time based on text length
  const processingTime = Math.min(2000, text.length * 50);
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Calculate realistic duration based on speaking rate
  const words = text.split(' ').length;
  const baseWordsPerMinute = 150;
  const adjustedWPM = baseWordsPerMinute * voiceConfig.speed;
  const durationSeconds = (words / adjustedWPM) * 60;
  
  // Generate mock audio URL (in production, this would be actual audio)
  const audioUrl = `data:audio/mp3;base64,character-voice-${encodeURIComponent(voiceConfig.name)}-${Date.now()}`;
  
  return {
    audioUrl,
    duration: Math.max(1, Math.round(durationSeconds))
  };
}
