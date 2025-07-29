// lib/cache.js - Add Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  static async getScenarios(filters = {}) {
    const cacheKey = `scenarios:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const scenarios = await fetchScenariosFromDB(filters);
    await redis.setex(cacheKey, 300, JSON.stringify(scenarios)); // 5 min cache
    return scenarios;
  }

  static async invalidateUserCache(userEmail) {
    const keys = await redis.keys(`user:${userEmail}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
