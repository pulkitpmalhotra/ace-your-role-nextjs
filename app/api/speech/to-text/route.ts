// app/api/speech/to-text/route.ts - Google Cloud Speech-to-Text
export async function POST(request: Request) {
  try {
    const { audioData, config } = await request.json();
    
    if (!audioData) {
      return Response.json(
        { success: false, error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // For now, we'll use a mock response until Google Cloud is fully set up
    // This will be replaced with actual Google Cloud Speech API call
    const mockTranscription = {
      transcript: extractTextFromAudio(audioData),
      confidence: 0.95,
      words: [],
      languageCode: 'en-US'
    };

    console.log('🎤 Speech-to-Text processed:', mockTranscription.transcript);

    return Response.json({
      success: true,
      data: {
        transcript: mockTranscription.transcript,
        confidence: mockTranscription.confidence,
        words: mockTranscription.words,
        languageCode: mockTranscription.languageCode,
        model: 'google-cloud-speech'
      }
    });

  } catch (error) {
    console.error('Speech-to-Text API error:', error);
    return Response.json(
      { success: false, error: 'Speech recognition failed' },
      { status: 500 }
    );
  }
}

// Mock function - will be replaced with actual Google Cloud Speech API
function extractTextFromAudio(audioData: string): string {
  // For demo purposes, return some sample responses
  const samplePhrases = [
    "Hi, I'm interested in learning more about your solution.",
    "That sounds good, but I'm concerned about the cost.",
    "Can you tell me more about the implementation process?",
    "What kind of support do you provide after implementation?",
    "I need to discuss this with my team before making a decision.",
    "How does this compare to your competitors?",
    "What's the timeline for getting this up and running?",
    "I'd like to see a demo of the product in action."
  ];
  
  // Return a random sample phrase for demo
  return samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
}
