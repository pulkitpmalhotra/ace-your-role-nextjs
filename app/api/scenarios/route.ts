export async function GET() {
  try {
    console.log('📚 Fetching scenarios...');

    const mockScenarios = [
      {
        id: "1",
        title: "Software Sales Discovery Call",
        description: "Practice uncovering pain points and building rapport with a busy IT Director",
        character_name: "Sarah Johnson",
        character_role: "IT Director",
        difficulty: "intermediate",
        category: "sales",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z"
      },
      {
        id: "2",
        title: "Healthcare Budget Discussion", 
        description: "Navigate budget constraints with a hospital administrator",
        character_name: "Dr. Michael Chen",
        character_role: "Hospital Administrator",
        difficulty: "advanced",
        category: "healthcare",
        is_active: true,
        created_at: "2024-01-14T14:30:00Z"
      }
    ];

    return Response.json({
      success: true,
      data: mockScenarios,
      meta: {
        total: mockScenarios.length,
        timestamp: new Date().toISOString()
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
