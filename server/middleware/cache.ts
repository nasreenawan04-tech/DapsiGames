import type { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function cacheMiddleware(duration: number = CACHE_DURATION) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      cache.set(key, {
        data: body,
        timestamp: Date.now(),
      });
      
      setTimeout(() => cache.delete(key), duration);
      
      return originalJson(body);
    };

    next();
  };
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
