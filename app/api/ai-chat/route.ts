// app/api/ai-agent/route.ts - Missing AI Agent Route
export async function POST(request: Request) {
  try {
    const { 
      scenario, 
      userMessage, 
      conversationHistory, 
      sessionState,
      sessionId 
    } = await request.json();
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ Missing GEMINI_API_KEY environment variable');
      return fallbackResponse(scenario);
    }

    if (!scenario || !userMessage || !sessionId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🧠 AI Agent processing:', {
      character: scenario.character_name,
      messageCount: conversationHistory.length,
      sessionDuration: sessionState?.duration || 0
    });

    // Build enhanced prompt
    const prompt = buildEnhancedPrompt(scenario, userMessage, conversationHistory, sessionState);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 250,
            candidateCount: 1,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    const cleanedResponse = cleanAIResponse(aiResponse.trim());
    
    // Determine if conversation should end naturally
    const shouldEnd = shouldEndConversation(conversationHistory, sessionState);

    const enhancedResponse = {
      response: cleanedResponse,
      character: scenario.character_name,
      emotion: determineEmotionalState(conversationHistory),
      shouldEndConversation: shouldEnd,
      model: 'ai-agent',
      contextRetained: true
    };

    console.log('✅ AI agent response generated');

    return Response.json({
      success: true,
      data: enhancedResponse
    });

  } catch (error) {
    console.error('💥 AI Agent error:', error);
    return fallbackResponse(null);
  }
}

function buildEnhancedPrompt(scenario: any, userMessage: string, conversationHistory: any[], sessionState: any): string {
  const userRole = getUserRole(scenario.role);
  const duration = Math.floor((sessionState?.duration || 0) / 60);
  const exchanges = Math.floor(conversationHistory.length / 2);

  return `You are ${scenario.character_name}, a ${scenario.character_role}. You are having a conversation with a ${userRole} in this scenario: "${scenario.title}".

CHARACTER CONTEXT:
- You are ${scenario.character_name}
- Your role: ${scenario.character_role}
- Conversation duration: ${duration} minutes
- Exchanges so far: ${exchanges}

CONVERSATION HISTORY:
${conversationHistory.slice(-6).map(msg => 
  `${msg.speaker === 'user' ? userRole : scenario.character_name}: "${msg.message}"`
).join('\n')}

CURRENT SITUATION:
The ${userRole} just said: "${userMessage}"

INSTRUCTIONS:
- Stay in character as ${scenario.character_name}
- Respond naturally and professionally
- Keep responses conversational (1-2 sentences)
- Show personality appropriate to your role
- Consider the full conversation context
- Be helpful but realistic to your character

${exchanges >= 8 ? `
NATURAL CONCLUSION:
This conversation has good depth. Consider providing a natural conclusion if appropriate.
You can thank them for the discussion and suggest next steps.
` : `
CONTINUE CONVERSATION:
Build on the discussion naturally. Ask relevant questions or provide helpful responses.
`}

Respond as ${scenario.character_name}:`;
}

function shouldEndConversation(conversationHistory: any[], sessionState: any): boolean {
  const exchanges = Math.floor(conversationHistory.length / 2);
  const duration = sessionState?.duration || 0;
  
  return exchanges >= 8 || duration >= 600; // 10+ minutes or 8+ exchanges
}

function determineEmotionalState(conversationHistory: any[]): string {
  const exchanges = Math.floor(conversationHistory.length / 2);
  
  if (exchanges >= 8) return 'satisfied';
  if (exchanges >= 6) return 'engaged';
  if (exchanges >= 4) return 'interested';
  return 'professional';
}

function getUserRole(scenarioRole: string): string {
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
  return roleMap[scenarioRole] || 'professional';
}

function cleanAIResponse(response: string): string {
  return response
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^\*|\*$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fallbackResponse(scenario: any) {
  return Response.json({
    success: true,
    data: {
      response: "I understand what you're saying. This has been a really valuable conversation, and I appreciate the time we've spent discussing this together.",
      character: scenario?.character_name || 'Character',
      emotion: 'professional',
      shouldEndConversation: true,
      model: 'fallback'
    }
  });
}

// ============================================
// app/api/sessions/route.ts - Fixed Sessions Route
// ============================================

import { createClient } from '@supabase/supabase-js';

// Create a new session
export async function POST(request: Request) {
  try {
    const { scenario_id, user_email } = await request.json();
    
    console.log('🎯 Session creation request:', { scenario_id, user_email });
    
    if (!scenario_id || !user_email) {
      return Response.json(
        { success: false, error: 'Scenario ID and user email are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
    
    // Ensure user exists
    console.log('👤 Checking/creating user:', user_email);
    
    let user;
    const { data: existingUser, error: fetchError } = await supabaseService
      .from('users')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return Response.json(
        { success: false, error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error: createError } = await supabaseService
        .from('users')
        .insert({
          email: user_email.trim().toLowerCase(),
          name: user_email.split('@')[0],
          total_sessions: 0,
          total_minutes: 0,
          auth_provider: 'google',
          created_at: new Date().toISOString()
        })
        .select('id, email')
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return Response.json(
          { success: false, error: `Failed to create user: ${createError.message}` },
          { status: 500 }
        );
      }
      
      user = newUser;
    }

    // Verify scenario exists
    const { data: scenario, error: scenarioError } = await supabaseAnon
      .from('scenarios')
      .select('id, title, character_name')
      .eq('id', scenario_id)
      .single();

    if (scenarioError || !scenario) {
      console.error('❌ Scenario not found:', scenario_id);
      return Response.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Create new session
    const { data: session, error: sessionError } = await supabaseService
      .from('sessions')
      .insert({
        user_id: user.id,
        scenario_id: scenario_id,
        user_email: user_email,
        conversation: [],
        session_status: 'active',
        start_time: new Date().toISOString()
      })
      .select(`
        *,
        scenarios:scenarios(*),
        users:users(name, email)
      `)
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return Response.json(
        { success: false, error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Session created successfully:', session.id);

    return Response.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('💥 Sessions POST API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Update session
export async function PUT(request: Request) {
  try {
    const { session_id, conversation, session_status, duration_minutes, overall_score, conversation_metadata } = await request.json();
    
    if (!session_id) {
      return Response.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const updateData: any = {};
    if (conversation) updateData.conversation = conversation;
    if (session_status) updateData.session_status = session_status;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (overall_score !== undefined) updateData.overall_score = overall_score;
    if (conversation_metadata) updateData.conversation_metadata = conversation_metadata;
    
    updateData.updated_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('💥 Sessions PUT API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_email = searchParams.get('user_email');
    
    if (!session_id && !user_email) {
      return Response.json(
        { success: false, error: 'Session ID or user email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let query = supabase.from('sessions').select('*');
    
    if (session_id) {
      query = query.eq('id', session_id);
    } else if (user_email) {
      query = query.eq('user_email', user_email).order('created_at', { ascending: false });
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data: session_id ? sessions?.[0] : sessions
    });

  } catch (error) {
    console.error('💥 Sessions GET API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
