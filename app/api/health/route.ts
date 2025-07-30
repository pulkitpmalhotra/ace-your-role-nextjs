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
