export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const envVars = {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    supabaseUrlStart: process.env.SUPABASE_URL?.substring(0, 30) + '...',
    supabaseKeyStart: process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    geminiKeyStart: process.env.GEMINI_API_KEY?.substring(0, 20) + '...',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('GEMINI')
    )
  };

  res.status(200).json({
    success: true,
    environment: envVars,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
}
