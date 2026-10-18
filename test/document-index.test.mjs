import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DocumentIndex } from '../build/services/DocumentIndex.js';

const docs = [
  {
    path: 'RELEASENOTES.md',
    name: 'RELEASENOTES.md',
    content: '# Release notes\n\n' + 'A new release of AL-Go was created. '.repeat(300)
  },
  {
    path: 'Scenarios/CreateRelease.md',
    name: 'CreateRelease.md',
    content: '# Create a release of your app\n\n![image](x.png)\n\nOpen Actions and select **Create Release**, then run the workflow.'
  },
  {
    path: 'Workshop/PerformanceTesting.md',
    name: 'PerformanceTesting.md',
    content: '# Performance Testing\n\nAdd a BCPT performance test app to your repository.'
  }
];

const fakeSource = (files = docs) => {
  const source = { calls: 0, async getDocumentationFiles() { source.calls++; return files; } };
  return source;
};

test('a focused guide outranks long release notes', async () => {
  const results = await new DocumentIndex().search(fakeSource(), 'create release', 3);
  assert.equal(results[0].path, 'Scenarios/CreateRelease.md');
  assert.equal(results[0].title, 'Create a release of your app');
});

test('excerpt shows the matching line, not headings or images', async () => {
  const [top] = await new DocumentIndex().search(fakeSource(), 'create release', 1);
  assert.match(top.excerpt, /Create Release/);
  assert.doesNotMatch(top.excerpt, /!\[image\]/);
});

test('regex characters in queries are harmless', async () => {
  const index = new DocumentIndex();
  for (const query of ['c++', '(build', '[test', 'a*b?', '\\']) {
    await assert.doesNotReject(index.search(fakeSource(), query, 3), query);
  }
});

test('index is built once per document set', async () => {
  const index = new DocumentIndex();
  const source = fakeSource();
  await index.search(source, 'release', 3);
  await index.search(source, 'performance', 3);
  assert.equal(source.calls, 2, 'documents are requested each time (the source caches them)');

  // A new document set (e.g. after the cache expired) is picked up
  const updated = fakeSource([...docs, { path: 'Workshop/Hotfix.md', name: 'Hotfix.md', content: '# Hotfix\n\nShip a hotfix.' }]);
  const results = await index.search(updated, 'hotfix', 3);
  assert.equal(results[0].path, 'Workshop/Hotfix.md');
});

test('an empty document set is an error, not an empty result', async () => {
  await assert.rejects(new DocumentIndex().search(fakeSource([]), 'release', 3), /No AL-Go documents/);
});
