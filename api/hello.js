// api/hello.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      envVars: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('GEMINI'))
    }
  });
}
