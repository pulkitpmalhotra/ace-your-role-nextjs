// api/scenarios.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase';
import { APIResponse, Scenario } from './_types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all scenarios
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const response: APIResponse<Scenario[]> = {
        success: true,
        data: data || []
      };

      res.status(200).json(response);
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Scenarios API error:', error);
    
    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    res.status(500).json(response);
  }
}
