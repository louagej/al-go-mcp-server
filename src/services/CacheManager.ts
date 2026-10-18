/**
 * Cached knowledge source types
 */
export type CacheSource = 'docs' | 'discussion' | 'issue';

export const CACHE_SOURCES: readonly CacheSource[] = ['docs', 'discussion', 'issue'];

/**
 * Cached item with metadata
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  source: CacheSource;
}

/**
 * Single cache for everything fetched from GitHub, with per-source TTL
 * and hit/miss statistics
 */
export class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private inFlight: Map<string, Promise<any>> = new Map();
  private stats: Map<CacheSource, { hits: number; misses: number }> = new Map();

  // TTL configuration per source type (in milliseconds)
  private readonly ttlConfig: Record<CacheSource, number> = {
    docs: 24 * 60 * 60 * 1000,        // 24 hours - documentation changes with AL-Go releases
    discussion: 6 * 60 * 60 * 1000,   // 6 hours - frequently updated Q&A
    issue: 12 * 60 * 60 * 1000        // 12 hours - resolved issues change less often
  };

  constructor(private readonly now: () => number = Date.now) {
    for (const source of CACHE_SOURCES) {
      this.stats.set(source, { hits: 0, misses: 0 });
    }
  }

  private getKey(source: CacheSource, key: string): string {
    return `${source}:${key}`;
  }

  /**
   * Get item from cache if still within its TTL
   */
  get<T>(source: CacheSource, key: string): T | undefined {
    const cacheKey = this.getKey(source, key);
    const item = this.cache.get(cacheKey);
    const stat = this.stats.get(source)!;

    if (!item || this.now() - item.timestamp > this.ttlConfig[source]) {
      if (item) this.cache.delete(cacheKey);
      stat.misses++;
      return undefined;
    }

    stat.hits++;
    return item.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(source: CacheSource, key: string, data: T): void {
    this.cache.set(this.getKey(source, key), { data, timestamp: this.now(), source });
  }

  /**
   * Return the cached value, or run the loader and cache its result.
   * Concurrent callers for the same key share one loader call; failures are not cached.
   */
  async getOrLoad<T>(source: CacheSource, key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(source, key);
    if (cached !== undefined) return cached;

    const cacheKey = this.getKey(source, key);
    let pending = this.inFlight.get(cacheKey) as Promise<T> | undefined;
    if (!pending) {
      pending = loader()
        .then(data => {
          this.set(source, key, data);
          return data;
        })
        .finally(() => this.inFlight.delete(cacheKey));
      this.inFlight.set(cacheKey, pending);
    }
    return pending;
  }

  /**
   * Clear cache for a specific source type
   */
  clearSource(source: CacheSource): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${source}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache
   */
  clearAll(): number {
    const count = this.cache.size;
    this.cache.clear();
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalItems: number; sources: Record<CacheSource, { items: number; hits: number; misses: number; hitRate: string; ttl: string }> } {
    const sources = {} as Record<CacheSource, { items: number; hits: number; misses: number; hitRate: string; ttl: string }>;

    for (const source of CACHE_SOURCES) {
      const { hits, misses } = this.stats.get(source)!;
      const total = hits + misses;
      const items = [...this.cache.values()].filter(i => i.source === source).length;
      sources[source] = {
        items,
        hits,
        misses,
        hitRate: total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : 'n/a',
        ttl: `${this.ttlConfig[source] / (60 * 60 * 1000)}h`
      };
    }

    return { totalItems: this.cache.size, sources };
  }

  /**
   * Format statistics for display
   */
  formatStats(): string {
    const stats = this.getStats();

    let output = `Total cached items: ${stats.totalItems}\n\n`;
    for (const [source, stat] of Object.entries(stats.sources)) {
      output += `**${source.toUpperCase()}** (TTL ${stat.ttl})\n`;
      output += `  Items: ${stat.items} | Hits: ${stat.hits} | Misses: ${stat.misses} | Hit rate: ${stat.hitRate}\n\n`;
    }

    return output.trimEnd();
  }
}
