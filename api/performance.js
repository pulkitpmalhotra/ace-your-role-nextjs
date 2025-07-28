// api/performance.js - Performance monitoring and optimization
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  console.log('⚡ Performance API called');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Return performance metrics
      const metrics = await getPerformanceMetrics();
      
      res.status(200).json({
        success: true,
        data: metrics
      });

    } else if (req.method === 'POST') {
      // Log performance data
      const { type, data, userEmail } = req.body;
      
      await logPerformanceData(type, data, userEmail);
      
      res.status(200).json({
        success: true,
        message: 'Performance data logged'
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('❌ Performance API error:', error);
    res.status(500).json({
      success: false,
      error: 'Performance monitoring failed'
    });
  }
}

async function getPerformanceMetrics() {
  const cacheKey = 'performance_metrics';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📊 Returning cached performance metrics');
    return cached.data;
  }

  try {
    // Get basic system metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      database: await getDatabaseMetrics(),
      api: await getAPIMetrics(),
      cache: {
        size: cache.size,
        hitRate: getCacheHitRate()
      }
    };

    // Cache the results
    cache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    });

    return metrics;

  } catch (error) {
    console.error('❌ Failed to get performance metrics:', error);
    return {
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    };
  }
}

async function getDatabaseMetrics() {
  try {
    const start = Date.now();
    
    // Test database response time
    const { data, error } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) {
      return {
        status: 'error',
        error: error.message,
        responseTime
      };
    }

    return {
      status: 'healthy',
      responseTime,
      recordsAvailable: data?.length > 0
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function getAPIMetrics() {
  // Get some basic API health metrics
  return {
    environment: process.env.NODE_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'
  };
}

function getCacheHitRate() {
  // Simple cache hit rate calculation
  // In a real implementation, you'd track hits vs misses
  return cache.size > 0 ? 0.85 : 0; // Simulated 85% hit rate
}

async function logPerformanceData(type, data, userEmail) {
  try {
    // Log performance events to help optimize the platform
    const performanceLog = {
      event_type: type,
      user_email: userEmail || 'anonymous',
      event_data: data,
      timestamp: new Date().toISOString(),
      user_agent: data.userAgent || 'unknown',
      page_url: data.pageUrl || 'unknown'
    };

    // In a real implementation, you might want to:
    // 1. Store in a separate performance_logs table
    // 2. Use a time-series database
    // 3. Send to an analytics service
    
    console.log('📊 Performance event logged:', {
      type,
      userEmail: userEmail || 'anonymous',
      timestamp: performanceLog.timestamp
    });

    // For now, we'll just log to console
    // You could store in Supabase if you create a performance_logs table

  } catch (error) {
    console.error('❌ Failed to log performance data:', error);
    // Don't throw error - performance logging shouldn't break the app
  }
}

// Helper function to clear cache (useful for debugging)
export function clearCache() {
  cache.clear();
  console.log('🗑️ Performance cache cleared');
}

// Helper function to get cache stats
export function getCacheStats() {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    size: JSON.stringify(value.data).length
  }));

  return {
    totalEntries: cache.size,
    entries,
    totalSize: entries.reduce((sum, entry) => sum + entry.size, 0)
  };
}
