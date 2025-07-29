// /utils/promptEngineering.js
export function generateCharacterPrompt(scenario, gender, emotion, messageCount, historyText, userMessage) {
  return `You are ${scenario.character_name}, a ${gender} ${scenario.character_role}.

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
}

function getCharacterProgression(messageCount) {
  if (messageCount < 3) return "Initial skepticism or distance";
  if (messageCount < 6) return "Growing engagement";
  if (messageCount < 9) return "Building trust";
  return "Open collaboration";
}

function getEmotionalProgression(currentEmotion, messageCount) {
  const progressionMap = {
    'skeptical': messageCount > 5 ? 'curious' : 'skeptical',
    'professional': messageCount > 7 ? 'engaged' : 'professional',
    'curious': messageCount > 4 ? 'interested' : 'curious',
    'interested': messageCount > 6 ? 'engaged' : 'interested',
    'engaged': 'engaged'
  };
  return progressionMap[currentEmotion] || currentEmotion;
}
