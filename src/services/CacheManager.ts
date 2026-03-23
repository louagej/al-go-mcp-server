/**
 * Cache configuration with TTL per source type
 */
export interface CacheConfig {
  source: 'workshop' | 'scenario' | 'discussion' | 'issue';
  ttlMs: number;
  maxSize?: number;
}

/**
 * Cached item with metadata
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  source: string;
}

/**
 * Advanced cache manager with per-source TTL and selective refresh
 */
export class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private stats: Map<string, { hits: number; misses: number; refreshes: number }> = new Map();

  // TTL configuration per source type (in milliseconds)
  private readonly ttlConfig: Map<string, number> = new Map([
    ['workshop', 24 * 60 * 60 * 1000],      // 24 hours - foundational, stable
    ['scenario', 24 * 60 * 60 * 1000],      // 24 hours - updated with releases
    ['discussion', 6 * 60 * 60 * 1000],     // 6 hours - frequently updated Q&A
    ['issue', 12 * 60 * 60 * 1000]          // 12 hours - resolved issues less frequent
  ]);

  constructor() {
    this.initializeStats();
  }

  /**
   * Initialize statistics tracking
   */
  private initializeStats(): void {
    for (const source of ['workshop', 'scenario', 'discussion', 'issue']) {
      this.stats.set(source, { hits: 0, misses: 0, refreshes: 0 });
    }
  }

  /**
   * Generate cache key
   */
  private getKey(source: string, query: string): string {
    return `${source}:${query}`;
  }

  /**
   * Get item from cache if valid
   */
  get<T>(source: string, query: string): T | null {
    const key = this.getKey(source, query);
    const item = this.cache.get(key);

    if (!item) {
      this.recordMiss(source);
      return null;
    }

    const ttl = this.getTTL(source);
    const age = Date.now() - item.timestamp;

    if (age > ttl) {
      this.cache.delete(key);
      this.recordMiss(source);
      return null;
    }

    this.recordHit(source);
    return item.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(source: string, query: string, data: T): void {
    const key = this.getKey(source, query);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      source
    });
  }

  /**
   * Get TTL for source type
   */
  private getTTL(source: string): number {
    return this.ttlConfig.get(source) || (24 * 60 * 60 * 1000);
  }

  /**
   * Check if cache is valid for source
   */
  isValid(source: string, query: string): boolean {
    const key = this.getKey(source, query);
    const item = this.cache.get(key);

    if (!item) return false;

    const ttl = this.getTTL(source);
    const age = Date.now() - item.timestamp;

    return age <= ttl;
  }

  /**
   * Record cache hit
   */
  private recordHit(source: string): void {
    const stat = this.stats.get(source);
    if (stat) stat.hits++;
  }

  /**
   * Record cache miss
   */
  private recordMiss(source: string): void {
    const stat = this.stats.get(source);
    if (stat) stat.misses++;
  }

  /**
   * Record refresh
   */
  recordRefresh(source: string): void {
    const stat = this.stats.get(source);
    if (stat) stat.refreshes++;
  }

  /**
   * Clear cache for specific source type
   */
  clearSource(source: string): number {
    let count = 0;
    for (const [key] of this.cache) {
      if (key.startsWith(`${source}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all expired items
   */
  clearExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, item] of this.cache) {
      const ttl = this.getTTL(item.source);
      if (now - item.timestamp > ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      totalItems: this.cache.size,
      sources: {}
    };

    for (const [source, data] of this.stats) {
      const total = data.hits + data.misses;
      const hitRate = total > 0 ? ((data.hits / total) * 100).toFixed(1) : 'N/A';

      stats.sources[source] = {
        hits: data.hits,
        misses: data.misses,
        refreshes: data.refreshes,
        hitRate: `${hitRate}%`,
        ttl: `${this.getTTL(source) / (60 * 60 * 1000)}h`
      };
    }

    return stats;
  }

  /**
   * Get all items for a source (for monitoring)
   */
  getSourceItems(source: string): Array<{ key: string; age: string; ttl: string }> {
    const items = [];
    const now = Date.now();
    const ttl = this.getTTL(source);

    for (const [key, item] of this.cache) {
      if (item.source === source) {
        const age = now - item.timestamp;
        items.push({
          key,
          age: `${(age / 60000).toFixed(1)}m`,
          ttl: `${(ttl / (60 * 60 * 1000)).toFixed(0)}h`
        });
      }
    }

    return items;
  }

  /**
   * Format statistics for display
   */
  formatStats(): string {
    const stats = this.getStats();

    let output = `Cache Statistics\n`;
    output += `Total items: ${stats.totalItems}\n\n`;

    for (const [source, data] of Object.entries(stats.sources)) {
      const stat = data as any;
      output += `**${source.toUpperCase()}**\n`;
      output += `  Hits: ${stat.hits} | Misses: ${stat.misses} | Hit Rate: ${stat.hitRate}\n`;
      output += `  Refreshes: ${stat.refreshes} | TTL: ${stat.ttl}\n\n`;
    }

    return output;
  }
}
