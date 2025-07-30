// app/api/scenarios/route.ts - Completely standalone API
export async function GET() {
  try {
    console.log('📚 Fetching scenarios...');

    // Mock data that matches your existing structure
    const mockScenarios = [
      {
        "id": "1",
        "title": "Software Sales Discovery Call",
        "description": "Practice uncovering pain points and building rapport with a busy IT Director",
        "character_name": "Sarah Johnson",
        "character_role": "IT Director",
        "character_personality": "Direct, analytical, time-conscious, values efficiency",
        "difficulty": "intermediate",
        "category": "sales",
        "subcategory": "discovery",
        "tags": ["B2B", "SaaS", "IT", "discovery"],
        "learning_objectives": ["Active listening", "Pain point identification", "Rapport building"],
        "estimated_duration_minutes": 15,
        "is_active": true,
        "created_at": "2024-01-15T10:00:00Z",
        "industry": "Technology"
      },
      {
        "id": "2",
        "title": "Healthcare Budget Discussion",
        "description": "Navigate budget constraints with a hospital administrator",
        "character_name": "Dr. Michael Chen",
        "character_role": "Hospital Administrator",
        "character_personality": "Cautious, detail-oriented, budget-conscious, patient-focused",
        "difficulty": "advanced",
        "category": "healthcare",
        "subcategory": "budget",
        "tags": ["healthcare", "budget", "B2B", "administration"],
        "learning_objectives": ["Budget navigation", "Value proposition", "ROI justification"],
        "estimated_duration_minutes": 20,
        "is_active": true,
        "created_at": "2024-01-14T14:30:00Z",
        "industry": "Healthcare"
      },
      {
        "id": "3",
        "title": "Retail Customer Service Challenge",
        "description": "Handle a frustrated customer with a product return",
        "character_name": "Jennifer Williams",
        "character_role": "Customer",
        "character_personality": "Frustrated, impatient, wants quick resolution",
        "difficulty": "beginner",
        "category": "support",
        "subcategory": "returns",
        "tags": ["customer service", "retail", "conflict resolution"],
        "learning_objectives": ["De-escalation", "Empathy", "Problem solving"],
        "estimated_duration_minutes": 10,
        "is_active": true,
        "created_at": "2024-01-13T09:15:00Z",
        "industry": "Retail"
      },
      {
        "id": "4",
        "title": "Legal Client Consultation",
        "description": "Initial consultation with a potential client for contract review",
        "character_name": "Robert Martinez",
        "character_role": "Business Owner",
        "character_personality": "Cautious, detail-oriented, cost-conscious",
        "difficulty": "advanced",
        "category": "legal",
        "subcategory": "consultation",
        "tags": ["legal", "contracts", "B2B", "consultation"],
        "learning_objectives": ["Trust building", "Needs assessment", "Service explanation"],
        "estimated_duration_minutes": 25,
        "is_active": true,
        "created_at": "2024-01-12T16:45:00Z",
        "industry": "Legal"
      },
      {
        "id": "5",
        "title": "Team Leadership Meeting",
        "description": "Address performance issues with an underperforming team member",
        "character_name": "Lisa Thompson",
        "character_role": "Team Member",
        "character_personality": "Defensive, experienced, resistant to feedback",
        "difficulty": "advanced",
        "category": "leadership",
        "subcategory": "performance",
        "tags": ["leadership", "performance", "feedback", "management"],
        "learning_objectives": ["Difficult conversations", "Feedback delivery", "Motivation"],
        "estimated_duration_minutes": 20,
        "is_active": true,
        "created_at": "2024-01-11T11:20:00Z",
        "industry": "Management"
      }
    ];

    // Apply any filters from query parameters
    const scenarios = mockScenarios.filter(scenario => scenario.is_active);

    console.log(`✅ Retrieved ${scenarios.length} scenarios`);
    
    return Response.json({
      success: true,
      data: scenarios,
      meta: {
        total: scenarios.length,
        timestamp: new Date().toISOString(),
        availableCategories: ["sales", "healthcare", "support", "legal", "leadership"],
        availableDifficulties: ["beginner", "intermediate", "advanced"],
        availableSubcategories: ["discovery", "budget", "returns", "consultation", "performance"]
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/health/route.ts - Health check endpoint
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'operational',
      database: 'mock-data',
      ai: 'ready'
    }
  });
}
