import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CacheManager } from '../build/services/CacheManager.js';

test('concurrent getOrLoad calls share one loader call', async () => {
  const cache = new CacheManager();
  let calls = 0;
  const loader = async () => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return ['doc'];
  };

  const results = await Promise.all([1, 2, 3].map(() => cache.getOrLoad('docs', 'all', loader)));
  assert.equal(calls, 1);
  assert.deepEqual(results, [['doc'], ['doc'], ['doc']]);

  await cache.getOrLoad('docs', 'all', loader);
  assert.equal(calls, 1, 'cached value should be reused');
});

test('entries expire after the source TTL', async () => {
  let now = 0;
  const cache = new CacheManager(() => now);
  let calls = 0;
  const loader = async () => ++calls;

  await cache.getOrLoad('discussion', 'recent', loader);
  now = 5 * 60 * 60 * 1000; // 5h, within the 6h discussion TTL
  assert.equal(await cache.getOrLoad('discussion', 'recent', loader), 1);
  now = 7 * 60 * 60 * 1000; // 7h, expired
  assert.equal(await cache.getOrLoad('discussion', 'recent', loader), 2);
});

test('failed loads are not cached', async () => {
  const cache = new CacheManager();
  await assert.rejects(cache.getOrLoad('issue', 'closed', async () => { throw new Error('rate limited'); }), /rate limited/);
  assert.equal(await cache.getOrLoad('issue', 'closed', async () => 'ok'), 'ok');
});

test('stats and clearing reflect real usage', async () => {
  const cache = new CacheManager();
  await cache.getOrLoad('docs', 'all', async () => 1);
  await cache.getOrLoad('docs', 'all', async () => 1);
  await cache.getOrLoad('issue', 'closed', async () => 1);

  const stats = cache.getStats();
  assert.equal(stats.totalItems, 2);
  assert.deepEqual(
    { items: stats.sources.docs.items, hits: stats.sources.docs.hits, misses: stats.sources.docs.misses, hitRate: stats.sources.docs.hitRate },
    { items: 1, hits: 1, misses: 1, hitRate: '50.0%' }
  );
  assert.equal(stats.sources.discussion.hitRate, 'n/a');

  assert.equal(cache.clearSource('docs'), 1);
  assert.equal(cache.clearAll(), 1);
  assert.equal(cache.getStats().totalItems, 0);
});
