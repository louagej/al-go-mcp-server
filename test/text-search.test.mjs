import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, stem, Bm25Index } from '../build/services/TextSearch.js';

test('stem reduces inflections to a shared stem', () => {
  for (const group of [
    ['release', 'releases', 'released', 'releasing'],
    ['create', 'created', 'creating'],
    ['test', 'tests', 'testing'],
    ['build', 'builds', 'building']
  ]) {
    assert.equal(new Set(group.map(stem)).size, 1, `expected one stem for ${group.join(', ')}`);
  }
});

test('tokenize splits camelCase, drops stopwords and punctuation', () => {
  assert.deepEqual(tokenize('CreateRelease.md'), ['creat', 'releas', 'md']);
  assert.deepEqual(tokenize('How do I use AL-Go?'), []);
  assert.deepEqual(tokenize('c++ (build'), ['build']);
});

test('title matches outrank long documents that repeat the term', () => {
  const index = new Bm25Index();
  index.add('notes', [
    { text: 'Release notes', weight: 4 },
    { text: 'release '.repeat(200) + 'filler '.repeat(2000), weight: 1 }
  ]);
  index.add('guide', [
    { text: 'Create a release', weight: 4 },
    { text: 'Run the Create Release workflow to create a release of your apps.', weight: 1 }
  ]);
  index.add('other', [
    { text: 'Publish to production', weight: 4 },
    { text: 'Deploy apps to an environment.', weight: 1 }
  ]);

  const results = index.search('create release');
  assert.deepEqual(results.map(r => r.item), ['guide', 'notes']);
});

test('items matching no query term are omitted', () => {
  const index = new Bm25Index();
  index.add('a', [{ text: 'build pipeline', weight: 1 }]);
  assert.deepEqual(index.search('weather forecast'), []);
  assert.deepEqual(index.search(''), []);
});

test('documents covering every query term outrank partial matches', () => {
  const index = new Bm25Index();
  index.add('both', [{ text: 'performance test app', weight: 1 }]);
  index.add('one', [{ text: 'performance performance performance', weight: 1 }]);
  assert.equal(index.search('performance test')[0].item, 'both');
});
