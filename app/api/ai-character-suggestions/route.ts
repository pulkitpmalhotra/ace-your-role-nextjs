// app/api/ai-character-suggestions/route.ts - Fixed TypeScript errors
export async function POST(request: Request): Promise<Response> {
  try {
    const { role, difficulty, userProgress, preferences } = await request.json();
    
    if (!role) {
      return Response.json(
        { success: false, error: 'Role is required for character suggestions' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating AI character suggestions for:', role, difficulty);

    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.warn('⚠️ Google AI API key not found, using enhanced fallback');
      const fallbackResult = generateFallbackCharacterSuggestions(role, difficulty, userProgress);
      return Response.json(fallbackResult);
    }

    // Generate AI-powered character suggestions
    const suggestions = await generateAICharacterSuggestions(role, difficulty, userProgress, preferences);
    
    return Response.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('❌ Character suggestions API error:', error);
    const fallbackResult = generateFallbackCharacterSuggestions(role, difficulty || 'intermediate');
    return Response.json(fallbackResult);
  }
}

async function generateAICharacterSuggestions(role: string, difficulty: string, userProgress: any, preferences: any): Promise<any> {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  const prompt = buildCharacterSuggestionPrompt(role, difficulty, userProgress, preferences);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8, // Higher creativity for character generation
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 1500,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Google AI');
    }

    return parseCharacterSuggestions(aiResponse, role, difficulty);

  } catch (error) {
    console.error('❌ Google AI character generation failed:', error);
    return generateFallbackCharacterSuggestions(role, difficulty).data;
  }
}

function buildCharacterSuggestionPrompt(role: string, difficulty: string, userProgress: any, preferences: any): string {
  const roleContext = getRoleContext(role);
  const difficultyContext = getDifficultyContext(difficulty);
  const progressContext = getProgressContext(userProgress);

  return `You are an expert character designer for professional roleplay training. Create 3 diverse, realistic characters for ${role} practice scenarios.

CONTEXT:
Role: ${role}
Difficulty: ${difficulty}
User Experience Level: ${progressContext}
${preferences ? `User Preferences: ${JSON.stringify(preferences)}` : ''}

ROLE REQUIREMENTS:
${roleContext}

DIFFICULTY REQUIREMENTS:
${difficultyContext}

INSTRUCTIONS:
Generate exactly 3 characters with different personalities, backgrounds, and challenge levels. Each character should:
1. Be realistic and professional
2. Present appropriate challenges for ${difficulty} level
3. Have distinct personality traits and communication styles
4. Include specific scenarios they'd be perfect for
5. Have clear motivations and concerns

For each character, provide:
- Name (realistic, professional)
- Professional Role/Title
- Personality Traits (3-4 key traits)
- Communication Style
- Primary Concerns/Motivations
- Challenge Type (what makes them interesting to practice with)
- Perfect Scenario Description
- Difficulty Justification

Format as JSON with this structure:
{
  "characters": [
    {
      "name": "Character Name",
      "role": "Professional Title",
      "personality": ["trait1", "trait2", "trait3"],
      "communication_style": "Brief description",
      "concerns": ["concern1", "concern2"],
      "challenge_type": "What makes them challenging/interesting",
      "scenario": "Perfect scenario description",
      "difficulty_notes": "Why this fits ${difficulty} level"
    }
  ]
}

Create characters that will genuinely help users improve their ${role} skills at ${difficulty} level.`;
}

function getRoleContext(role: string): string {
  const contexts: Record<string, string> = {
    'sales': 'Characters should represent different buyer personas: budget-conscious decision makers, technical evaluators, skeptical prospects, urgency-driven buyers, and relationship-focused clients. They should present realistic objections and buying scenarios.',
    
    'project-manager': 'Characters should include difficult stakeholders like demanding clients, resistant team members, executive sponsors with changing priorities, technical leads with concerns, and cross-functional partners with conflicting goals.',
    
    'product-manager': 'Characters should represent various stakeholders: engineering leads questioning feasibility, sales teams requesting features, executive sponsors with strategic concerns, customer success teams with user feedback, and design leads with UX perspectives.',
    
    'leader': 'Characters should include team members needing inspiration, resistant change agents, high-performers seeking growth, underperformers needing guidance, and cross-departmental leaders requiring collaboration.',
    
    'manager': 'Characters should represent different employee types: high performers seeking advancement, struggling team members needing support, experienced veterans resistant to change, new hires requiring guidance, and conflict-prone personalities.',
    
    'support-agent': 'Characters should include frustrated customers with urgent issues, confused users needing patient guidance, angry clients demanding escalation, technical users with complex problems, and repeat customers with ongoing concerns.',
    
    'data-analyst': 'Characters should represent business stakeholders seeking insights: executives needing strategic data, marketing teams wanting campaign analysis, operations teams requiring efficiency metrics, and product teams seeking user behavior insights.',
    
    'engineer': 'Characters should include non-technical stakeholders needing technical explanations, fellow engineers with different opinions, project managers with timeline pressures, and business leaders requiring technical feasibility assessments.',
    
    'nurse': 'Characters should represent diverse patient types: anxious patients needing reassurance, elderly patients requiring extra care, family members with concerns, difficult patients testing boundaries, and emergency situations requiring quick thinking.',
    
    'doctor': 'Characters should include worried patients with complex symptoms, family members seeking information, difficult diagnoses requiring delicate communication, second opinion seekers, and patients with lifestyle-related health issues.'
  };
  
  return contexts[role] || contexts['sales'];
}

function getDifficultyContext(difficulty: string): string {
  const contexts: Record<string, string> = {
    'beginner': 'Characters should be cooperative and receptive, with straightforward concerns and clear communication. They should help users practice fundamental conversation skills without overwhelming complexity.',
    
    'intermediate': 'Characters should present moderate challenges: some resistance, multiple competing priorities, or complex but manageable situations. They should push users to develop stronger persuasion and problem-solving skills.',
    
    'advanced': 'Characters should be highly challenging: strong objections, time pressure, complex personalities, difficult circumstances, or multiple competing stakeholders. They should test advanced communication techniques and emotional intelligence.'
  };
  
  return contexts[difficulty] || contexts['intermediate'];
}

function getProgressContext(userProgress: any): string {
  if (!userProgress || !userProgress.total_sessions) {
    return 'New user with no practice history';
  }
  
  const sessions = userProgress.total_sessions;
  const avgScore = userProgress.average_score || 0;
  
  if (sessions < 3) return 'Beginner with limited practice experience';
  if (sessions < 10) return 'Developing user with some practice experience';
  if (avgScore >= 4.0) return 'Advanced user with strong performance history';
  if (avgScore >= 3.0) return 'Intermediate user with solid fundamentals';
  return 'Developing user working to improve core skills';
}

function parseCharacterSuggestions(aiResponse: string, role: string, difficulty: string): any {
  try {
    // Try to parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.characters && Array.isArray(parsed.characters)) {
        return {
          characters: parsed.characters.slice(0, 3), // Ensure max 3 characters
          generation_method: 'google-ai-parsed',
          role: role,
          difficulty: difficulty
        };
      }
    }
  } catch (error) {
    console.warn('❌ Failed to parse AI JSON response, using fallback');
  }
  
  // Fallback to text parsing
  return parseTextBasedResponse(aiResponse, role, difficulty);
}

function parseTextBasedResponse(aiResponse: string, role: string, difficulty: string): any {
  // Extract character information from text response
  const characters = [];
  const sections = aiResponse.split(/(?=Name:|Character \d+:|^\d+\.)/gm);
  
  for (let i = 0; i < Math.min(3, sections.length); i++) {
    const section = sections[i];
    const character = extractCharacterFromText(section, role, difficulty);
    if (character) {
      characters.push(character);
    }
  }
  
  // If we couldn't parse any characters, use fallback
  if (characters.length === 0) {
    return generateFallbackCharacterSuggestions(role, difficulty).data;
  }
  
  return {
    characters: characters,
    generation_method: 'google-ai-text-parsed',
    role: role,
    difficulty: difficulty
  };
}

function extractCharacterFromText(text: string, role: string, difficulty: string): any {
  // Basic text extraction - in a real implementation, this would be more sophisticated
  const nameMatch = text.match(/(?:Name|Character)[:\s]*([A-Za-z\s]+)(?:\n|$)/i);
  const roleMatch = text.match(/(?:Role|Title|Position)[:\s]*([A-Za-z\s]+)(?:\n|$)/i);
  
  if (!nameMatch || !roleMatch) return null;
  
  return {
    name: nameMatch[1].trim(),
    role: roleMatch[1].trim(),
    personality: ['professional', 'experienced', 'focused'],
    communication_style: `${difficulty} level communication style`,
    concerns: ['business objectives', 'practical solutions'],
    challenge_type: `${difficulty} level challenge`,
    scenario: `Perfect for practicing ${role} skills`,
    difficulty_notes: `Designed for ${difficulty} level practice`
  };
}

function generateFallbackCharacterSuggestions(role: string, difficulty: string, userProgress?: any): { success: boolean; data: any } {
  console.log('📊 Generating fallback character suggestions...');
  
  const fallbackCharacters = getFallbackCharactersByRole(role, difficulty);
  
  return {
    success: true,
    data: {
      characters: fallbackCharacters,
      generation_method: 'fallback-curated',
      role: role,
      difficulty: difficulty
    }
  };
}

function getFallbackCharactersByRole(role: string, difficulty: string): any[] {
  const characterSets: Record<string, any[]> = {
    'sales': [
      {
        name: 'Sarah Chen',
        role: 'VP of Operations',
        personality: ['analytical', 'budget-conscious', 'results-driven'],
        communication_style: 'Direct and data-focused',
        concerns: ['ROI justification', 'implementation timeline'],
        challenge_type: 'Skeptical buyer requiring strong business case',
        scenario: 'Enterprise software evaluation with budget constraints',
        difficulty_notes: `${difficulty} level prospect with realistic objections`
      },
      {
        name: 'Marcus Rodriguez',
        role: 'IT Director',
        personality: ['technical', 'security-focused', 'cautious'],
        communication_style: 'Technical and detail-oriented',
        concerns: ['system integration', 'security compliance'],
        challenge_type: 'Technical evaluator with complex requirements',
        scenario: 'Technology solution assessment with integration concerns',
        difficulty_notes: `${difficulty} level technical buyer`
      },
      {
        name: 'Jennifer Walsh',
        role: 'CEO',
        personality: ['visionary', 'time-pressed', 'strategic'],
        communication_style: 'High-level and strategic',
        concerns: ['competitive advantage', 'growth acceleration'],
        challenge_type: 'Executive decision maker with limited time',
        scenario: 'Strategic solution presentation to C-level executive',
        difficulty_notes: `${difficulty} level executive interaction`
      }
    ],
    
    'support-agent': [
      {
        name: 'David Kim',
        role: 'Small Business Owner',
        personality: ['frustrated', 'time-pressed', 'practical'],
        communication_style: 'Direct and somewhat impatient',
        concerns: ['business disruption', 'quick resolution'],
        challenge_type: 'Frustrated customer needing empathy and solutions',
        scenario: 'Critical business system down affecting operations',
        difficulty_notes: `${difficulty} level customer service challenge`
      },
      {
        name: 'Lisa Thompson',
        role: 'Marketing Manager',
        personality: ['confused', 'apologetic', 'eager to learn'],
        communication_style: 'Polite but uncertain',
        concerns: ['understanding the solution', 'avoiding mistakes'],
        challenge_type: 'Confused user needing patient guidance',
        scenario: 'Complex feature explanation to non-technical user',
        difficulty_notes: `${difficulty} level support interaction`
      },
      {
        name: 'Robert Martinez',
        role: 'Operations Director',
        personality: ['demanding', 'experienced', 'no-nonsense'],
        communication_style: 'Assertive and expects expertise',
        concerns: ['service quality', 'accountability'],
        challenge_type: 'Demanding customer with high expectations',
        scenario: 'Service escalation requiring professional handling',
        difficulty_notes: `${difficulty} level challenging customer`
      }
    ],
    
    'project-manager': [
      {
        name: 'Alex Thompson',
        role: 'Engineering Lead',
        personality: ['technical', 'skeptical', 'detail-oriented'],
        communication_style: 'Direct technical communication',
        concerns: ['technical feasibility', 'resource allocation'],
        challenge_type: 'Technical stakeholder with resource concerns',
        scenario: 'Project scope discussion with technical constraints',
        difficulty_notes: `${difficulty} level technical stakeholder management`
      },
      {
        name: 'Maria Gonzalez',
        role: 'Client Director',
        personality: ['demanding', 'results-focused', 'impatient'],
        communication_style: 'Business-focused and urgent',
        concerns: ['project timeline', 'deliverable quality'],
        challenge_type: 'Demanding client with tight deadlines',
        scenario: 'Client status meeting with timeline pressures',
        difficulty_notes: `${difficulty} level client relationship management`
      },
      {
        name: 'James Wilson',
        role: 'Team Member',
        personality: ['overwhelmed', 'honest', 'collaborative'],
        communication_style: 'Open but concerned',
        concerns: ['workload balance', 'skill development'],
        challenge_type: 'Team member needing support and guidance',
        scenario: 'One-on-one discussion about project challenges',
        difficulty_notes: `${difficulty} level team management`
      }
    ]
  };
  
  const characters = characterSets[role] || characterSets['sales'];
  
  // Adjust difficulty characteristics
  return characters.map(char => ({
    ...char,
    difficulty_notes: `${difficulty} level: ${char.difficulty_notes}`
  }));
}
