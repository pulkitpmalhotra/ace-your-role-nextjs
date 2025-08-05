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
function getRoleContext(role: string): string {
  const contexts: Record<string, string> = {
    'sales': 'This is a sales conversation where the learner needs to understand prospect needs, present value, handle objections, and move toward a decision. Success is measured by relationship building and advancement of the sales process.',
    
    'project-manager': 'This is a project management conversation where the learner needs to coordinate stakeholders, manage timelines, communicate requirements, and ensure project success. Focus on leadership, organization, and clear communication.',
    
    'product-manager': 'This is a product management conversation where the learner needs to gather requirements, prioritize features, communicate product vision, and make data-driven decisions about product direction.',
    
    'leader': 'This is a leadership conversation where the learner needs to communicate vision, inspire teams, make strategic decisions, and guide organizational direction. Focus on influence, inspiration, and strategic thinking.',
    
    'manager': 'This is a people management conversation where the learner needs to provide feedback, coach team members, address performance issues, and develop others professionally.',
    
    'strategy-lead': 'This is a strategic planning conversation where the learner needs to analyze markets, develop strategic initiatives, communicate complex concepts, and drive organizational change.',
    
    'support-agent': 'This is a customer service interaction where the learner needs to resolve issues efficiently, maintain customer satisfaction, and turn potentially negative experiences into positive ones.',
    
    'data-analyst': 'This is a data analysis conversation where the learner needs to communicate insights clearly, ask relevant questions about data requirements, and translate complex analytics into actionable business recommendations.',
    
    'engineer': 'This is a technical conversation where the learner needs to discuss system architecture, explain technical concepts clearly, collaborate on solutions, and communicate with both technical and non-technical stakeholders.',
    
    'nurse': 'This is a healthcare conversation where the learner needs to provide patient care, coordinate with medical teams, explain procedures clearly, and ensure patient comfort and understanding.',
    
    'doctor': 'This is a medical consultation where the learner must show empathy, gather accurate information, explain complex medical concepts clearly, and ensure patient understanding and comfort.'
  };
  
  return contexts[role] || contexts['sales'];
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
function getFallbackObjectives(role: string): string[] {
  const objectives: Record<string, string[]> = {
    'sales': [
      'Build rapport and establish credibility early',
      'Understand their business needs and pain points',
      'Present relevant solutions with clear benefits',
      'Handle any objections or concerns professionally',
      'Guide the conversation toward next steps'
    ],
    
    'project-manager': [
      'Establish clear project scope and objectives',
      'Identify key stakeholders and their requirements',
      'Communicate timeline and resource expectations',
      'Address potential risks and mitigation strategies',
      'Ensure alignment on project deliverables'
    ],
    
    'product-manager': [
      'Gather comprehensive user requirements and needs',
      'Prioritize features based on business value and user impact',
      'Communicate product vision and strategy clearly',
      'Validate assumptions with data and user feedback',
      'Align stakeholders on product roadmap and priorities'
    ],
    
    'leader': [
      'Communicate organizational vision and strategic direction',
      'Inspire and motivate team members toward common goals',
      'Make difficult decisions with limited information',
      'Build consensus and alignment across diverse stakeholders',
      'Foster innovation and drive positive organizational change'
    ],
    
    'manager': [
      'Provide specific, constructive feedback on performance',
      'Listen actively to team member concerns and perspectives',
      'Set clear expectations and measurable goals',
      'Support professional development and career growth',
      'Create accountability while maintaining positive relationships'
    ],
    
    'strategy-lead': [
      'Analyze market trends and competitive landscape thoroughly',
      'Develop comprehensive strategic initiatives and plans',
      'Communicate complex strategic concepts to diverse audiences',
      'Build buy-in for strategic changes across the organization',
      'Establish metrics and success criteria for strategic initiatives'
    ],
    
    'support-agent': [
      'Quickly understand and diagnose the customer issue',
      'Show empathy for customer frustration and concerns',
      'Provide clear, step-by-step troubleshooting guidance',
      'Ensure complete issue resolution and customer satisfaction',
      'Document issues and follow up on resolution effectiveness'
    ],
    
    'data-analyst': [
      'Understand business questions and analytical requirements',
      'Identify appropriate data sources and analysis methods',
      'Communicate findings clearly to non-technical stakeholders',
      'Provide actionable insights and recommendations',
      'Validate results and ensure analytical accuracy'
    ],
    
    'engineer': [
      'Understand technical requirements and system constraints',
      'Design scalable and maintainable technical solutions',
      'Communicate technical concepts to non-technical stakeholders',
      'Collaborate effectively with cross-functional teams',
      'Consider security, performance, and maintainability in solutions'
    ],
    
    'nurse': [
      'Provide compassionate and professional patient care',
      'Communicate clearly with patients and family members',
      'Coordinate effectively with medical team members',
      'Follow proper protocols and safety procedures',
      'Document patient care accurately and thoroughly'
    ],
    
    'doctor': [
      'Gather comprehensive patient history and symptoms',
      'Explain medical conditions and treatment options clearly',
      'Show empathy while maintaining professional boundaries',
      'Make evidence-based diagnostic and treatment decisions',
      'Ensure patient understanding and informed consent'
    ]
  };
  
  return objectives[role] || objectives['sales'];
}


// Fallback tips by category
function getFallbackTips(role: string): string[] {
  const tips: Record<string, string[]> = {
    'sales': [
      'Ask open-ended questions to understand their business needs',
      'Listen actively and acknowledge their concerns and priorities',
      'Connect features to specific benefits for their situation',
      'Be prepared to discuss ROI and implementation details'
    ],
    
    'project-manager': [
      'Ask clarifying questions about scope, timeline, and resources',
      'Identify potential risks early and discuss mitigation strategies',
      'Ensure all stakeholders understand their roles and responsibilities',
      'Communicate progress regularly and proactively address issues'
    ],
    
    'product-manager': [
      'Ask about user needs, pain points, and desired outcomes',
      'Prioritize features based on impact and feasibility',
      'Use data and user feedback to validate product decisions',
      'Communicate product vision clearly to align stakeholders'
    ],
    
    'leader': [
      'Connect daily work to the broader organizational mission',
      'Ask for input and ideas from team members',
      'Be transparent about challenges and decision-making rationale',
      'Recognize and celebrate team achievements and progress'
    ],
    
    'manager': [
      'Start with positive observations before discussing improvements',
      'Be specific about behaviors and their impact on the team',
      'Ask for their perspective and input on solutions',
      'Create collaborative development plans with clear next steps'
    ],
    
    'strategy-lead': [
      'Ask probing questions about market trends and competitive threats',
      'Use data and analysis to support strategic recommendations',
      'Consider multiple scenarios and contingency plans',
      'Communicate strategy in terms of business impact and outcomes'
    ],
    
    'support-agent': [
      'Acknowledge their frustration before diving into solutions',
      'Ask specific questions to diagnose the problem accurately',
      'Explain each solution step clearly and confirm understanding',
      'Follow up to ensure the solution worked effectively'
    ],
    
    'data-analyst': [
      'Ask clarifying questions about business objectives and success metrics',
      'Explain analytical methods and limitations clearly',
      'Focus on actionable insights rather than just data points',
      'Validate findings and consider alternative explanations'
    ],
    
    'engineer': [
      'Ask detailed questions about technical requirements and constraints',
      'Consider scalability, maintainability, and security from the start',
      'Explain technical concepts using analogies and clear examples',
      'Collaborate with stakeholders to balance technical and business needs'
    ],
    
    'nurse': [
      'Use empathetic language and active listening with patients',
      'Explain procedures and care plans in understandable terms',
      'Coordinate communication between patients and medical team',
      'Follow proper protocols while maintaining patient comfort'
    ],
    
    'doctor': [
      'Ask open-ended questions about symptoms and patient concerns',
      'Explain medical concepts using clear, non-technical language',
      'Show empathy while maintaining professional clinical judgment',
      'Involve patients in treatment decisions and ensure informed consent'
    ]
  };
  
  return tips[role] || tips['sales'];
}
