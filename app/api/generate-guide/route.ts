// app/api/generate-guide/route.ts - AI-Powered Scenario Guide Generation
export async function POST(request: Request) {
  try {
    const { scenario } = await request.json();
    
    if (!scenario) {
      return Response.json(
        { success: false, error: 'Scenario data is required' },
        { status: 400 }
      );
    }

    console.log('🧠 Generating AI guide for scenario:', scenario.title);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ No Gemini API key, using fallback guide');
      return Response.json({
        success: true,
        data: generateFallbackGuide(scenario),
        source: 'fallback'
      });
    }

    // Build specific prompt for this scenario
    const prompt = buildGuidePrompt(scenario);

    console.log('🤖 Calling Gemini for guide generation...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7, // Balanced creativity and consistency
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 800,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return Response.json({
        success: true,
        data: generateFallbackGuide(scenario),
        source: 'fallback-api-error'
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('❌ No response content from Gemini');
      return Response.json({
        success: true,
        data: generateFallbackGuide(scenario),
        source: 'fallback-empty-response'
      });
    }

    // Parse AI response into structured guide
    const guide = parseAIGuide(aiResponse.trim(), scenario);
    
    console.log('✅ AI guide generated successfully for:', scenario.title);

    return Response.json({
      success: true,
      data: guide,
      source: 'ai-generated'
    });

  } catch (error) {
    console.error('💥 Generate guide API error:', error);
    
    // Always return a working guide, even on error
    const scenario = (await request.json()).scenario;
    return Response.json({
      success: true,
      data: generateFallbackGuide(scenario),
      source: 'fallback-error'
    });
  }
}

// Build scenario-specific prompt for AI
function buildGuidePrompt(scenario: any) {
  const categoryContext = getCategoryContext(scenario.category);
  const difficultyContext = getDifficultyContext(scenario.difficulty);
  
  return `You are an expert ${scenario.category} communication coach. Generate specific, actionable practice guidance for this exact roleplay scenario.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description || 'Standard practice scenario'}
- Category: ${scenario.category}
- Difficulty: ${scenario.difficulty}

CHARACTER DETAILS:
- Name: ${scenario.character_name}
- Role: ${scenario.character_role}
- Personality: ${scenario.character_personality || 'Professional with realistic concerns'}

CONTEXT:
${categoryContext}

DIFFICULTY LEVEL:
${difficultyContext}

Generate a practice guide with the following structure:

**GOAL:** (1 specific sentence about what the learner should achieve in THIS scenario with THIS character)

**OBJECTIVES:** (4-5 specific bullet points tailored to this exact scenario and character)

**SUCCESS TIPS:** (4-5 actionable tips specific to dealing with ${scenario.character_name} in this ${scenario.category} situation)

**CHARACTER INSIGHTS:** (2-3 insights about how to specifically interact with ${scenario.character_name} based on their role and personality)

Make everything specific to this scenario - avoid generic advice. Focus on the unique aspects of talking with ${scenario.character_name} about ${scenario.title}. Be practical and actionable.

Response format:
GOAL: [specific goal]
OBJECTIVES:
• [specific objective 1]
• [specific objective 2]
• [specific objective 3]
• [specific objective 4]
• [specific objective 5]
TIPS:
• [specific tip 1]
• [specific tip 2]
• [specific tip 3]
• [specific tip 4]
• [specific tip 5]
INSIGHTS:
• [character insight 1]
• [character insight 2]
• [character insight 3]`;
}

// Get category-specific context
function getCategoryContext(category: string): string {
  const contexts: Record<string, string> = {
    'sales': 'This is a sales conversation where the learner needs to understand prospect needs, present value, handle objections, and move toward a decision. Success is measured by relationship building and advancement of the sales process.',
    'healthcare': 'This is a medical consultation where the learner must show empathy, gather accurate information, explain complex concepts clearly, and ensure patient understanding and comfort.',
    'support': 'This is a customer service interaction where the learner needs to resolve issues efficiently, maintain customer satisfaction, and turn potentially negative experiences into positive ones.',
    'legal': 'This is a legal consultation where the learner must gather case details, explain legal options clearly, manage client expectations, and provide professional guidance.',
    'leadership': 'This is a management conversation where the learner needs to provide effective feedback, motivate team members, address performance issues, and develop others.'
  };
  
  return contexts[category] || contexts['sales'];
}

// Get difficulty-specific context
function getDifficultyContext(difficulty: string): string {
  const contexts: Record<string, string> = {
    'beginner': 'This is a beginner-level scenario. The character will be cooperative and receptive. Focus on fundamental communication skills, basic rapport building, and straightforward interaction patterns.',
    'intermediate': 'This is an intermediate-level scenario. The character may have some resistance, multiple concerns, or competing priorities. Practice handling moderate complexity and building stronger persuasion skills.',
    'advanced': 'This is an advanced-level scenario. Expect challenging objections, complex situations, time pressure, or difficult personality traits. Focus on advanced techniques and managing complex dynamics.'
  };
  
  return contexts[difficulty] || contexts['intermediate'];
}

// Parse AI response into structured guide object
function parseAIGuide(aiResponse: string, scenario: any) {
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  let goal = '';
  const objectives: string[] = [];
  const tips: string[] = [];
  const insights: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('GOAL:')) {
      goal = trimmed.replace('GOAL:', '').trim();
      currentSection = 'goal';
    } else if (trimmed.includes('OBJECTIVES:') || trimmed.includes('OBJECTIVE:')) {
      currentSection = 'objectives';
    } else if (trimmed.includes('TIPS:') || trimmed.includes('TIP:')) {
      currentSection = 'tips';
    } else if (trimmed.includes('INSIGHTS:') || trimmed.includes('INSIGHT:')) {
      currentSection = 'insights';
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^[•\-*]\s*/, '').trim();
      if (content) {
        if (currentSection === 'objectives') {
          objectives.push(content);
        } else if (currentSection === 'tips') {
          tips.push(content);
        } else if (currentSection === 'insights') {
          insights.push(content);
        }
      }
    }
  }
  
  return {
    goal: goal || `Master effective communication with ${scenario.character_name} in this ${scenario.category} scenario`,
    objectives: objectives.length > 0 ? objectives : getFallbackObjectives(scenario.category),
    tips: tips.length > 0 ? tips : getFallbackTips(scenario.category),
    insights: insights.length > 0 ? insights : [
      `${scenario.character_name} will respond based on their ${scenario.character_role} perspective`,
      `Adapt your communication style to match their professional needs and concerns`
    ]
  };
}

// Generate fallback guide when AI is unavailable
function generateFallbackGuide(scenario: any) {
  return {
    goal: `Practice effective ${scenario.category} communication with ${scenario.character_name}`,
    objectives: getFallbackObjectives(scenario.category),
    tips: getFallbackTips(scenario.category),
    insights: [
      `${scenario.character_name} represents a typical ${scenario.character_role}`,
      `Focus on their professional needs and communication preferences`,
      `Build rapport while achieving your conversation objectives`
    ]
  };
}

// Fallback objectives by category
function getFallbackObjectives(category: string): string[] {
  const objectives: Record<string, string[]> = {
    'sales': [
      'Build rapport and establish credibility early',
      'Understand their business needs and pain points',
      'Present relevant solutions with clear benefits',
      'Handle any objections or concerns professionally',
      'Guide the conversation toward next steps'
    ],
    'healthcare': [
      'Show empathy and build patient trust',
      'Gather comprehensive health information',
      'Explain medical concepts in understandable terms',
      'Address patient concerns and questions',
      'Provide clear guidance for next steps'
    ],
    'support': [
      'Quickly understand the customer issue',
      'Show empathy for their frustration',
      'Provide clear troubleshooting guidance',
      'Ensure complete issue resolution',
      'Confirm customer satisfaction'
    ],
    'legal': [
      'Gather detailed information about their situation',
      'Explain legal options in clear terms',
      'Discuss potential risks and outcomes',
      'Address their concerns about costs and timeline',
      'Provide actionable next steps'
    ],
    'leadership': [
      'Provide specific, constructive feedback',
      'Listen actively to their perspective',
      'Set clear expectations and goals',
      'Support their professional development',
      'Create accountability and follow-up plans'
    ]
  };
  
  return objectives[category] || objectives['sales'];
}

// Fallback tips by category
function getFallbackTips(category: string): string[] {
  const tips: Record<string, string[]> = {
    'sales': [
      'Ask open-ended questions to understand their business',
      'Listen actively and acknowledge their concerns',
      'Connect features to specific benefits for their situation',
      'Be prepared to discuss ROI and implementation details'
    ],
    'healthcare': [
      'Use empathetic language and active listening',
      'Ask follow-up questions about symptoms and concerns',
      'Explain medical terms in simple language',
      'Provide reassurance while being honest about next steps'
    ],
    'support': [
      'Acknowledge their frustration before diving into solutions',
      'Ask specific questions to diagnose the problem accurately',
      'Explain each solution step clearly and simply',
      'Confirm their understanding before moving to the next step'
    ],
    'legal': [
      'Ask detailed questions about their specific situation',
      'Explain legal concepts in everyday language',
      'Be transparent about potential outcomes and timelines',
      'Discuss fees and process expectations upfront'
    ],
    'leadership': [
      'Start with positive observations before areas for improvement',
      'Be specific about behaviors and their impact',
      'Ask for their perspective and input on solutions',
      'Create collaborative development plans together'
    ]
  };
  
  return tips[category] || tips['sales'];
}
