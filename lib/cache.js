import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.redis = null;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      if (process.env.UPSTASH_REDIS_REST_URL) {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        console.log('✅ Redis connected successfully');
      } else {
        console.log('⚠️ Redis not configured, using memory cache');
      }
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
    }
  }

  // Scenario caching with smart invalidation
  static async getCachedScenarios(filters = {}) {
    const cacheKey = `scenarios:${JSON.stringify(filters)}`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('📈 Returning cached scenarios');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.log('Cache miss, fetching from DB');
    }
    
    const scenarios = await this.fetchScenariosFromDB(filters);
    
    // Cache for 5 minutes
    try {
      await this.redis.setex(cacheKey, 300, JSON.stringify(scenarios));
    } catch (error) {
      console.log('Failed to cache scenarios');
    }
    
    return scenarios;
  }

  // User session caching
  static async getCachedUserSessions(userEmail) {
    const cacheKey = `user:${userEmail}:sessions`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.log('Session cache miss');
    }
    
    const sessions = await this.fetchUserSessionsFromDB(userEmail);
    
    // Cache for 10 minutes
    try {
      await this.redis.setex(cacheKey, 600, JSON.stringify(sessions));
    } catch (error) {
      console.log('Failed to cache sessions');
    }
    
    return sessions;
  }

  // AI response caching for repeated conversations
  static async getCachedAIResponse(scenarioId, userMessage, conversationContext) {
    const contextHash = this.hashConversationContext(scenarioId, userMessage, conversationContext);
    const cacheKey = `ai:${contextHash}`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('🤖 Using cached AI response');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.log('No cached AI response');
    }
    
    return null; // No cache hit
  }

  static async cacheAIResponse(scenarioId, userMessage, conversationContext, response) {
    const contextHash = this.hashConversationContext(scenarioId, userMessage, conversationContext);
    const cacheKey = `ai:${contextHash}`;
    
    // Cache AI responses for 1 hour
    try {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(response));
    } catch (error) {
      console.log('Failed to cache AI response');
    }
  }

  // Cache invalidation
  static async invalidateUserCache(userEmail) {
    const keys = [`user:${userEmail}:*`];
    
    try {
      const matchingKeys = await this.redis.keys(`user:${userEmail}:*`);
      if (matchingKeys.length > 0) {
        await this.redis.del(...matchingKeys);
        console.log(`🗑️ Invalidated ${matchingKeys.length} cache entries for ${userEmail}`);
      }
    } catch (error) {
      console.log('Failed to invalidate user cache');
    }
  }

  static hashConversationContext(scenarioId, userMessage, context) {
    const data = JSON.stringify({ scenarioId, userMessage, context: context.slice(-3) });
    return Buffer.from(data).toString('base64').slice(0, 32);
  }
}

export default CacheService;
