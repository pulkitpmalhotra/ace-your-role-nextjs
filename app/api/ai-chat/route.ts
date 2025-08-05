// app/api/ai-chat/route.ts - Key changes needed
export async function POST(request: Request) {
  try {
    const { scenario, userMessage, conversationHistory, messageCount, enhancedMode } = await request.json();
    
    // ... existing code ...

    console.log('👤 User is practicing as:', getTrainerRole(scenario.role)); // Changed from category

    const emotion = determineAdvancedEmotionProgression(messageCount || 0, conversationHistory, userMessage, scenario);
    const conversationStage = getConversationStage(messageCount || 0, scenario.role); // Changed from category
    
    // ... rest of function ...
  }
}

// Updated role mappings
function getTrainerRole(role: string): string {
  const roleMap: Record<string, string> = {
    'sales': 'salesperson',
    'project-manager': 'project manager',
    'product-manager': 'product manager', 
    'leader': 'leader',
    'manager': 'manager',
    'strategy-lead': 'strategy lead',
    'support-agent': 'customer service representative',
    'data-analyst': 'data analyst',
    'engineer': 'engineer',
    'nurse': 'healthcare provider',
    'doctor': 'healthcare provider'
  };
  return roleMap[role] || 'professional';
}

function getTrainerObjective(role: string): string {
  const objectiveMap: Record<string, string> = {
    'sales': 'sell you a solution and understand your needs',
    'project-manager': 'coordinate projects and manage stakeholders effectively',
    'product-manager': 'define product strategy and gather requirements',
    'leader': 'provide vision and strategic guidance',
    'manager': 'lead teams and manage performance effectively',
    'strategy-lead': 'develop strategic initiatives and drive execution',
    'support-agent': 'help resolve your customer service issue',
    'data-analyst': 'analyze data and provide insights for decision making',
    'engineer': 'discuss technical solutions and development approaches',
    'nurse': 'provide you with medical care and support',
    'doctor': 'provide you with medical care and diagnosis'
  };
  return objectiveMap[role] || 'help you professionally';
}

function getConversationStage(messageCount: number, role: string) {
  if (messageCount === 0) return 'Initial Contact';
  if (messageCount < 3) return 'Rapport Building';
  if (messageCount < 6) return getMiddleStage(role);
  if (messageCount < 9) return 'Solution Discussion';
  return 'Decision Making';
}

function getMiddleStage(role: string): string {
  const stageMap: Record<string, string> = {
    'sales': 'Needs Discovery',
    'project-manager': 'Requirements Gathering',
    'product-manager': 'Feature Discussion',
    'leader': 'Vision Alignment',
    'manager': 'Performance Review',
    'strategy-lead': 'Strategic Planning',
    'support-agent': 'Issue Diagnosis',
    'data-analyst': 'Data Analysis',
    'engineer': 'Technical Design',
    'nurse': 'Assessment',
    'doctor': 'Symptom Assessment'
  };
  return stageMap[role] || 'Information Gathering';
}

// Updated character motivation based on role
function getCharacterMotivation(role: string): string {
  const motivations: Record<string, string> = {
    'sales': 'You need to evaluate if this solution will help your business. You want to understand ROI and implementation.',
    'project-manager': 'You need clear project requirements, timelines, and want to ensure all stakeholders are aligned.',
    'product-manager': 'You want to understand user needs and how features will impact product success and user experience.',
    'leader': 'You are focused on strategic outcomes and how initiatives align with organizational goals and vision.',
    'manager': 'You want to understand team performance, provide feedback, and ensure individuals are developing professionally.',
    'strategy-lead': 'You need to evaluate strategic initiatives for feasibility, impact, and alignment with business objectives.',
    'support-agent': 'You have a problem that needs solving and want quick, effective help with clear resolution steps.',
    'data-analyst': 'You want to understand data requirements, analysis methods, and how insights will drive decisions.',
    'engineer': 'You are focused on technical feasibility, implementation details, and system architecture considerations.',
    'nurse': 'You want to understand patient care protocols, procedures, and ensure quality healthcare delivery.',
    'doctor': 'You need to gather patient information, make accurate diagnoses, and provide appropriate treatment plans.'
  };
  
  return motivations[role] || motivations['sales'];
}

// Updated industry context
function getIndustryContext(role: string): string {
  const contexts: Record<string, string> = {
    'sales': 'B2B sales environment focused on understanding client needs and presenting value propositions.',
    'project-manager': 'Project management environment requiring coordination, planning, and stakeholder communication.',
    'product-manager': 'Product development environment focused on user needs, market research, and feature prioritization.',
    'leader': 'Leadership environment requiring vision communication, strategic thinking, and organizational influence.',
    'manager': 'People management environment focused on team development, performance management, and coaching.',
    'strategy-lead': 'Strategic planning environment requiring market analysis, competitive intelligence, and execution planning.',
    'support-agent': 'Customer service environment where the character needs efficient problem resolution and customer satisfaction.',
    'data-analyst': 'Analytics environment focused on data interpretation, statistical analysis, and business insights.',
    'engineer': 'Technical development environment requiring problem-solving, system design, and implementation planning.',
    'nurse': 'Healthcare environment focused on patient care, medical procedures, and healthcare team collaboration.',
    'doctor': 'Medical consultation environment focused on diagnosis, treatment planning, and patient communication.'
  };
  
  return contexts[role] || contexts['sales'];
}

// Updated fallback responses
function fallbackResponse(scenario: any) {
  const characterResponses: Record<string, string[]> = {
    'sales': [
      "That's an interesting point. Can you tell me more about how this would benefit our company?",
      "I need to understand the ROI better. What results have other companies seen?",
      "How does your solution compare to what we're currently using?"
    ],
    'project-manager': [
      "What's the timeline for this project? I need to understand the scope and deliverables.",
      "How does this align with our current project priorities and resource allocation?",
      "What are the key milestones and dependencies we need to consider?"
    ],
    'product-manager': [
      "How does this feature align with our product roadmap and user research findings?",
      "What's the expected impact on user engagement and business metrics?",
      "Have we validated this concept with our target user segments?"
    ],
    'leader': [
      "How does this initiative support our strategic objectives and company vision?",
      "What's the expected ROI and how does this compare to other strategic priorities?",
      "How will we measure success and what are the key performance indicators?"
    ],
    'manager': [
      "I've been handling this responsibility effectively. What specific areas need improvement?",
      "Can you provide context about how this feedback aligns with team goals?",
      "What support and resources are available to help me develop in this area?"
    ],
    'strategy-lead': [
      "What market research supports this strategic direction?",
      "How does this initiative differentiate us from competitors?",
      "What are the potential risks and how do we plan to mitigate them?"
    ],
    'support-agent': [
      "I'm experiencing this issue and need a resolution. What troubleshooting steps should I try?",
      "This problem is affecting my productivity. How quickly can we resolve this?",
      "I've tried the basic solutions already. What's the next level of support?"
    ],
    'data-analyst': [
      "What data sources should I analyze to answer this business question?",
      "How should I structure this analysis to provide actionable insights?",
      "What statistical methods would be most appropriate for this dataset?"
    ],
    'engineer': [
      "What are the technical requirements and constraints for this feature?",
      "How should we architect this solution for scalability and maintainability?",
      "What are the potential technical risks and how do we mitigate them?"
    ],
    'nurse': [
      "What's the proper protocol for this patient care situation?",
      "How should I prioritize these patient needs and coordinate with the medical team?",
      "What documentation and follow-up care is required?"
    ],
    'doctor': [
      "Based on these symptoms, what diagnostic tests should we consider?",
      "What are the treatment options and their potential side effects?",
      "How should we monitor the patient's progress and adjust treatment?"
    ]
  };
  
  const role = scenario?.role || 'sales';
  const responses = characterResponses[role] || characterResponses['sales'];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return Response.json({
    success: true,
    data: {
      response: randomResponse,
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      model: 'fallback-enhanced',
      note: 'Enhanced fallback response'
    }
  });
}
