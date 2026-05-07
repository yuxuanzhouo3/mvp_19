type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60000; // 默认缓存1分钟
  private maxSize = 500; // 最大缓存条目数
  private cleanupThreshold = 0.8; // 达到80%容量时触发清理

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 超过80%容量时，清理一半过期缓存
    if (this.cache.size >= this.maxSize * this.cleanupThreshold) {
      this.cleanup();
    }

    // 再次检查，清理后如果还是满的，删除最老的缓存
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 根据模式删除缓存
   */
  deleteByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; maxSize: number; usage: string } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`,
    };
  }
}

export const cache = new SimpleCache();

/**
 * 生成缓存键
 */
export function makeCacheKey(table: string, filters?: any): string {
  const filtersStr = filters ? JSON.stringify(filters) : 'all';
  return `${table}:${filtersStr}`;
}
