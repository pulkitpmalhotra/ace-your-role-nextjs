// api/scenarios.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get all scenarios
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const response = {
      success: true,
      data: data || []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Scenarios API error:', error);
    
    const response = {
      success: false,
      error: error.message || 'Unknown error'
    };

    res.status(500).json(response);
  }
}
