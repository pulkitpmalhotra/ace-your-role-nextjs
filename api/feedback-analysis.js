// /api/feedback-analysis.js
async function generateRealFeedback(conversation, scenario, apiKey) {
  const analysisPrompt = `
GEMINI 2.5 ADVANCED ANALYSIS:
You are an expert sales trainer with 20+ years experience. Analyze this conversation using advanced reasoning.

THINKING PROCESS:
1. Read the entire conversation for context
2. Identify key sales methodology elements
3. Assess each category with specific evidence
4. Generate actionable improvement recommendations
5. Predict next session focus areas

ENHANCED SCORING CRITERIA (1-5 scale with 0.1 precision):
- Consider micro-expressions in language
- Evaluate emotional intelligence demonstrated
- Assess adaptability to character responses
- Measure outcome probability

CONVERSATION ANALYSIS:
${conversation.map(msg => `${msg.speaker}: ${msg.message}`).join('\n')}

Provide detailed analysis with specific examples and nuanced scoring.`;

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: analysisPrompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower for consistency
        maxOutputTokens: 2000, // More detailed feedback
        thinkingBudget: 'medium' // Allow deeper analysis
      }
    })
  });
  
  return processEnhancedFeedback(response);
}
