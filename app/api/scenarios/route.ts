// app/api/scenarios/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Fetching scenarios...');

    const { data: scenarios, error } = await supabaseAdmin
      .from('scenarios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return Response.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    console.log(`✅ Retrieved ${scenarios?.length || 0} scenarios`);
    
    return Response.json({
      success: true,
      data: scenarios || [],
      meta: {
        total: scenarios?.length || 0,
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
