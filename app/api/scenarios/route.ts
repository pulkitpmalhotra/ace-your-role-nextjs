// app/api/scenarios/route.ts - Enhanced with real Supabase data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const difficulty = searchParams.get('difficulty') || 'all';
    
    console.log('📚 Fetching scenarios with filters:', { category, difficulty });

    // Try to connect to Supabase if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    let scenarios = [];
    
    if (supabaseUrl && supabaseKey) {
      try {
        // Use Supabase data
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        let query = supabase
          .from('scenarios')
          .select('*')
          .eq('is_active', true);
          
        if (category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (difficulty !== 'all') {
          query = query.eq('difficulty', difficulty);
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (!error && data) {
          scenarios = data;
          console.log(`✅ Retrieved ${scenarios.length} scenarios from Supabase`);
        } else {
          console.log('⚠️ Supabase query failed, using mock data');
          scenarios = getMockScenarios();
        }
      } catch (error) {
        console.log('⚠️ Supabase connection failed, using mock data');
        scenarios = getMockScenarios();
      }
    } else {
      console.log('⚠️ Supabase not configured, using mock data');
      scenarios = getMockScenarios();
    }
    
    // Apply client-side filtering for mock data
    const filteredScenarios = scenarios.filter(scenario => {
      const categoryMatch = category === 'all' || scenario.category === category;
      const difficultyMatch = difficulty === 'all' || scenario.difficulty === difficulty;
      return categoryMatch && difficultyMatch && scenario.is_active;
    });

    return Response.json({
      success: true,
      data: filteredScenarios,
      meta: {
        total: filteredScenarios.length,
        timestamp: new Date().toISOString(),
        source: supabaseUrl ? 'supabase' : 'mock',
        filters: { category, difficulty }
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

function getMockScenarios() {
  return [
    {
      id: "1",
      title: "Software Sales Discovery Call",
      description: "Practice uncovering pain points and building rapport with a busy IT Director who's evaluating new software solutions for their team.",
      character_name: "Sarah Johnson",
      character_role: "IT Director",
      character_personality: "Direct, analytical, time-conscious, values efficiency and ROI",
      difficulty: "intermediate",
      category: "sales",
      subcategory: "discovery",
      tags: ["B2B", "SaaS", "IT", "discovery", "needs-analysis"],
      learning_objectives: ["Active listening", "Pain point identification", "Rapport building", "Technical needs assessment"],
      estimated_duration_minutes: 15,
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
      industry: "Technology"
    },
    {
      id: "2",
      title: "Healthcare Budget Discussion",
      description: "Navigate budget constraints with a hospital administrator who needs to justify every expense while ensuring patient care quality.",
      character_name: "Dr. Michael Chen",
      character_role: "Hospital Administrator",
      character_personality: "Cautious, detail-oriented, budget-conscious, patient-focused, analytical",
      difficulty: "advanced",
      category: "healthcare",
      subcategory: "budget",
      tags: ["healthcare", "budget", "B2B", "administration", "ROI"],
      learning_objectives: ["Budget navigation", "Value proposition", "ROI justification", "Stakeholder management"],
      estimated_duration_minutes: 20,
      is_active: true,
      created_at: "2024-01-14T14:30:00Z",
      industry: "Healthcare"
    },
    {
      id: "3",
      title: "Retail Customer Service Challenge",
      description: "Handle a frustrated customer who received a damaged product and wants immediate resolution during the busy holiday season.",
      character_name: "Jennifer Williams",
      character_role: "Frustrated Customer",
      character_personality: "Impatient, upset, wants quick resolution, values good service",
      difficulty: "beginner",
      category: "support",
      subcategory: "returns",
      tags: ["customer service", "retail", "conflict resolution", "returns"],
      learning_objectives: ["De-escalation", "Empathy", "Problem solving", "Service recovery"],
      estimated_duration_minutes: 10,
      is_active: true,
      created_at: "2024-01-13T09:15:00Z",
      industry: "Retail"
    },
    {
      id: "4",
      title: "Legal Client Consultation",
      description: "Initial consultation with a business owner who needs contract review but is concerned about legal costs and timelines.",
      character_name: "Robert Martinez",
      character_role: "Small Business Owner",
      character_personality: "Cautious, cost-conscious, detail-oriented, wants clear explanations",
      difficulty: "advanced",
      category: "legal",
      subcategory: "consultation",
      tags: ["legal", "contracts", "B2B", "consultation", "professional services"],
      learning_objectives: ["Trust building", "Needs assessment", "Service explanation", "Fee discussion"],
      estimated_duration_minutes: 25,
      is_active: true,
      created_at: "2024-01-12T16:45:00Z",
      industry: "Legal"
    },
    {
      id: "5",
      title: "Team Leadership Challenge",
      description: "Address performance issues with an experienced team member who's resistant to feedback and change.",
      character_name: "Lisa Thompson",
      character_role: "Senior Team Member",
      character_personality: "Defensive, experienced, resistant to feedback, values autonomy",
      difficulty: "advanced",
      category: "leadership",
      subcategory: "performance",
      tags: ["leadership", "performance", "feedback", "management", "difficult conversations"],
      learning_objectives: ["Difficult conversations", "Feedback delivery", "Motivation", "Change management"],
      estimated_duration_minutes: 20,
      is_active: true,
      created_at: "2024-01-11T11:20:00Z",
      industry: "Management"
    },
    {
      id: "6",
      title: "Insurance Claim Discussion",
      description: "Help a policyholder understand their coverage and guide them through the claims process after a recent incident.",
      character_name: "Amanda Davis",
      character_role: "Insurance Policyholder",
      character_personality: "Anxious, confused about process, needs reassurance and clear guidance",
      difficulty: "intermediate",
      category: "support",
      subcategory: "claims",
      tags: ["insurance", "claims", "customer support", "process guidance"],
      learning_objectives: ["Process explanation", "Reassurance", "Documentation guidance", "Expectation setting"],
      estimated_duration_minutes: 18,
      is_active: true,
      created_at: "2024-01-10T13:30:00Z",
      industry: "Insurance"
    },
    {
      id: "7",
      title: "Real Estate Negotiation",
      description: "Negotiate with a potential home buyer who loves the property but has concerns about the price and market conditions.",
      character_name: "David Kim",
      character_role: "Home Buyer",
      character_personality: "Interested but cautious, concerned about market, wants good value",
      difficulty: "intermediate",
      category: "sales",
      subcategory: "negotiation",
      tags: ["real estate", "negotiation", "B2C", "home buying", "market conditions"],
      learning_objectives: ["Negotiation tactics", "Value demonstration", "Market knowledge", "Closing techniques"],
      estimated_duration_minutes: 22,
      is_active: true,
      created_at: "2024-01-09T15:20:00Z",
      industry: "Real Estate"
    },
    {
      id: "8",
      title: "Executive Presentation Feedback",
      description: "Deliver constructive feedback to a direct report about their presentation to the board of directors.",
      character_name: "Maria Gonzalez",
      character_role: "Marketing Manager",
      character_personality: "Ambitious, receptive to feedback, wants to improve, career-focused",
      difficulty: "beginner",
      category: "leadership",
      subcategory: "feedback",
      tags: ["leadership", "feedback", "presentation skills", "professional development"],
      learning_objectives: ["Constructive feedback", "Coaching", "Professional development", "Communication skills"],
      estimated_duration_minutes: 12,
      is_active: true,
      created_at: "2024-01-08T10:45:00Z",
      industry: "Management"
    }
  ];
}
