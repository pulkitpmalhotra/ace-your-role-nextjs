// lib/gemini.ts
import type { GeminiResponse, AIResponseData, Scenario } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL = process.env.GEMINI_API_URL!;

export async function generateAIResponse(
  scenario: Scenario,
  userMessage: string,
  conversationHistory: Array<{ speaker: string; message: string }>,
  messageCount: number = 0
): Promise<AIResponseData> {
  
  const emotion = determineEmotion(messageCount, conversationHistory);
  const gender = getCharacterGender(scenario.character_name);
  
  const prompt = `You are ${scenario.character_name}, a ${gender} ${scenario.character_role}.

ENHANCED CONTEXT (Gemini 2.5):
- Conversation Turn: ${messageCount + 1}
- Emotional State: ${emotion}
- Industry Context: ${scenario.category}
- Character Arc: ${getCharacterProgression(messageCount)}

THINKING PROCESS:
1. Analyze user's message intent and emotional tone
2. Consider my character's realistic response based on role and personality
3. Determine appropriate emotional progression
4. Generate contextually relevant response

RESPONSE GUIDELINES:
- Stay in character as ${scenario.character_name}
- Respond naturally in 15-30 words
- Show emotional evolution: ${getEmotionalProgression(emotion, messageCount)}
- Use industry-specific knowledge from ${scenario.category}

Current situation: "${userMessage}"
Your authentic response:`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          topK: 50,
          topP: 0.95,
          maxOutputTokens: 150,
          candidateCount: 1,
          stopSequences: [],
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 
      "I understand. Could you tell me more about that?";

    return {
      response: aiResponse.trim(),
      character: scenario.character_name,
      emotion,
      gender
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    
    return {
      response: "I appreciate you sharing that. Could you elaborate on your needs?",
      character: scenario.character_name,
      emotion: 'professional',
      gender
    };
  }
}

function determineEmotion(messageCount: number, history: Array<{ speaker: string; message: string }>): string {
  if (messageCount === 0) return 'professional';
  if (messageCount < 3) return 'curious';
  if (messageCount < 6) return 'interested';
  if (messageCount < 9) return 'engaged';
  return 'collaborative';
}

function getCharacterGender(characterName: string): 'male' | 'female' | 'neutral' {
  const femaleNames = [
    'sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily',
    'jessica', 'rachel', 'amanda', 'michelle', 'angela', 'melissa', 'stephanie'
  ];
  
  const firstName = characterName.toLowerCase().split(' ')[0];
  return femaleNames.includes(firstName) ? 'female' : 'male';
}

function getCharacterProgression(messageCount: number): string {
  if (messageCount < 3) return "Initial skepticism or distance";
  if (messageCount < 6) return "Growing engagement";
  if (messageCount < 9) return "Building trust";
  return "Open collaboration";
}

function getEmotionalProgression(currentEmotion: string, messageCount: number): string {
  const progressionMap: Record<string, string> = {
    'professional': messageCount > 7 ? 'engaged' : 'professional',
    'curious': messageCount > 4 ? 'interested' : 'curious', 
    'interested': messageCount > 6 ? 'engaged' : 'interested',
    'engaged': 'engaged'
  };
  return progressionMap[currentEmotion] || currentEmotion;
}
