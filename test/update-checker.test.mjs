import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkForUpdate, detectInstallMethod, formatUpdateNotice, isNewerVersion } from '../build/services/UpdateChecker.js';

test('isNewerVersion compares releases numerically', () => {
  assert.equal(isNewerVersion('2.9.0', '2.8.0'), true);
  assert.equal(isNewerVersion('2.10.0', '2.9.0'), true);
  assert.equal(isNewerVersion('3.0.0', '2.99.99'), true);
  assert.equal(isNewerVersion('2.9.0', '2.9.0'), false);
  assert.equal(isNewerVersion('2.8.9', '2.9.0'), false);
  assert.equal(isNewerVersion('3.0.0-beta.1', '2.9.0'), false, 'pre-releases are never offered');
  assert.equal(isNewerVersion('2.9.0', '2.9.0-dev'), false);
  assert.equal(isNewerVersion('garbage', '2.9.0'), false);
});

test('detectInstallMethod', () => {
  const p = (...parts) => path.join(path.sep, ...parts);
  assert.equal(detectInstallMethod(p('home', 'u', '.npm', '_npx', 'abc123', 'node_modules', 'al-go-mcp-server', 'build')), 'npx');
  assert.equal(detectInstallMethod(p('usr', 'lib', 'node_modules', 'al-go-mcp-server', 'build')), 'installed');
  assert.equal(detectInstallMethod(p('src', 'al-go-mcp-server', 'build')), 'source');
});

const fakeFetch = (response) => async (url) => {
  fakeFetch.lastUrl = url;
  if (response instanceof Error) throw response;
  return { ok: response.ok ?? true, json: async () => response.body };
};

test('checkForUpdate returns only newer versions', async () => {
  assert.equal(await checkForUpdate('pkg', '2.8.0', { fetchImpl: fakeFetch({ body: { version: '2.9.0' } }) }), '2.9.0');
  assert.equal(await checkForUpdate('pkg', '2.9.0', { fetchImpl: fakeFetch({ body: { version: '2.9.0' } }) }), undefined);
});

test('checkForUpdate uses the configured registry', async () => {
  await checkForUpdate('al-go-mcp-server', '1.0.0', { registry: 'https://npm.example.com/', fetchImpl: fakeFetch({ body: {} }) });
  assert.equal(fakeFetch.lastUrl, 'https://npm.example.com/al-go-mcp-server/latest');
});

test('checkForUpdate treats any failure as no update', async () => {
  assert.equal(await checkForUpdate('pkg', '1.0.0', { fetchImpl: fakeFetch(new Error('offline')) }), undefined);
  assert.equal(await checkForUpdate('pkg', '1.0.0', { fetchImpl: fakeFetch({ ok: false }) }), undefined);
  assert.equal(await checkForUpdate('pkg', '1.0.0', { fetchImpl: fakeFetch({ body: 'not json' }) }), undefined);
});

test('update notice tells the user how to update for their install method', () => {
  assert.match(formatUpdateNotice('al-go-mcp-server', '2.9.0', '2.10.0', 'npx'), /2\.10\.0 is available \(you have 2\.9\.0\): restart the MCP server/);
  assert.match(formatUpdateNotice('al-go-mcp-server', '2.9.0', '2.10.0', 'installed'), /npm install -g al-go-mcp-server@latest/);
});
