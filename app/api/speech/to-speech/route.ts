// app/api/speech/to-speech/route.ts - Simple version without complex typing
export async function POST(request: Request) {
  try {
    const { text, character, emotion, gender } = await request.json();
    
    if (!text) {
      return Response.json(
        { success: false, error: 'No text provided' },
        { status: 400 }
      );
    }

    // Simple voice selection
    const voiceConfig = {
      name: gender === 'female' ? 'en-US-Journey-F' : 'en-US-Journey-M',
      speed: emotion === 'curious' ? 1.1 : emotion === 'engaged' ? 0.95 : 1.0,
      pitch: emotion === 'curious' ? 2 : emotion === 'collaborative' ? -1 : 0
    };
    
    // Generate mock audio URL
    const mockAudioUrl = `data:audio/mp3;base64,mock-${text.length}-${voiceConfig.name}`;

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
        duration: Math.ceil(text.split(' ').length / 2.5), // ~150 words per minute
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
