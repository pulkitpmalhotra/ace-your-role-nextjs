// /lib/cache.js - Redis caching layer
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export class CacheService {
  // Scenario caching with smart invalidation
  static async getCachedScenarios(filters = {}) {
    const cacheKey = `scenarios:${JSON.stringify(filters)}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 Returning cached scenarios');
        return cached;
      }
      
      console.log('📡 Fetching fresh scenarios');
      const scenarios = await fetchScenariosFromDB(filters);
      
      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, scenarios);
      return scenarios;
    } catch (error) {
      console.error('Cache error, falling back to DB:', error);
      return await fetchScenariosFromDB(filters);
    }
  }

  // User session caching
  static async getCachedUserSessions(userEmail) {
    const cacheKey = `user:${userEmail}:sessions`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const sessions = await fetchUserSessionsFromDB(userEmail);
    await redis.setex(cacheKey, 600, sessions); // Cache for 10 minutes
    return sessions;
  }

  // AI response caching for repeated conversations
  static async getCachedAIResponse(scenarioId, userMessage, conversationContext) {
    const contextHash = this.hashConversationContext(scenarioId, userMessage, conversationContext);
    const cacheKey = `ai:${contextHash}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('🤖 Using cached AI response');
      return cached;
    }
    
    return null; // No cache hit
  }

  static async cacheAIResponse(scenarioId, userMessage, conversationContext, response) {
    const contextHash = this.hashConversationContext(scenarioId, userMessage, conversationContext);
    const cacheKey = `ai:${contextHash}`;
    
    // Cache AI responses for 1 hour
    await redis.setex(cacheKey, 3600, response);
  }

  // Cache invalidation
  static async invalidateUserCache(userEmail) {
    const pattern = `user:${userEmail}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache entries for ${userEmail}`);
    }
  }

  static hashConversationContext(scenarioId, userMessage, context) {
    const data = JSON.stringify({ scenarioId, userMessage, context: context.slice(-3) }); // Last 3 messages
    return Buffer.from(data).toString('base64').slice(0, 32);
  }
}
