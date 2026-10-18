// Starts the built server over stdio, the way an MCP client does, and exercises
// the tools that work offline. Network-backed tools are covered by unit tests
// with fake sources instead.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../build/index.js', import.meta.url));

/**
 * Create a fake home with an existing VS Code user folder, so we can check
 * whether the server writes agent files into it
 */
function makeFakeHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'algo-mcp-test-'));
  const appData = path.join(home, 'AppData', 'Roaming');
  const userDir = process.platform === 'win32'
    ? path.join(appData, 'Code', 'User')
    : process.platform === 'darwin'
      ? path.join(home, 'Library', 'Application Support', 'Code', 'User')
      : path.join(home, '.config', 'Code', 'User');
  fs.mkdirSync(userDir, { recursive: true });
  return { home, appData, promptsDir: path.join(userDir, 'prompts') };
}

async function startServer(extraEnv = {}) {
  const fake = makeFakeHome();
  const env = { ...process.env, HOME: fake.home, USERPROFILE: fake.home, APPDATA: fake.appData, ...extraEnv };
  delete env.GITHUB_TOKEN;
  delete env.AL_GO_MCP_GITHUB_TOKEN;

  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], env, stderr: 'ignore' });
  const transportErrors = [];
  transport.onerror = error => transportErrors.push(error);

  const client = new Client({ name: 'test', version: '0.0.0' });
  await client.connect(transport);
  return { client, transportErrors, fake };
}

const text = result => result.content.map(c => c.text).join('\n');

let server;
before(async () => { server = await startServer(); });
after(async () => {
  await server?.client.close();
  fs.rmSync(server.fake.home, { recursive: true, force: true });
});

test('lists every tool', async () => {
  const { tools } = await server.client.listTools();
  const names = tools.map(t => t.name).sort();
  assert.deepEqual(names, [
    'alg-ask', 'alg-build-knowledge-graph', 'alg-cache-stats', 'alg-clear-cache',
    'alg-get-scenarios', 'alg-get-server-version', 'alg-get-specialist', 'alg-get-specialist-knowledge',
    'alg-get-workflows', 'alg-graph-visualization', 'alg-list-specialists', 'alg-refresh-cache',
    'alg-search-discussions', 'alg-search-docs', 'alg-search-issues', 'alg-search-specialists',
    'alg-semantic-search'
  ]);
});

test('alg-ask routes a natural question to the right specialist', async () => {
  const result = await server.client.callTool({ name: 'alg-ask', arguments: { question: 'How do I create a release?' } });
  assert.ok(!result.isError);
  assert.match(text(result), /You ARE \*\*Riley\*\*/);
  assert.match(text(result), /Other specialists for this question/);
});

test('alg-ask honours an explicit specialist handle', async () => {
  const result = await server.client.callTool({ name: 'alg-ask', arguments: { question: 'help', specialist: '@alg-freddy' } });
  assert.match(text(result), /You ARE \*\*Freddy\*\*/);
});

test('alg-ask falls back instead of failing when nothing matches', async () => {
  const result = await server.client.callTool({ name: 'alg-ask', arguments: { question: 'what is the weather' } });
  assert.ok(!result.isError);
  assert.match(text(result), /No specialist matched this question closely/);
});

test('alg-search-specialists ranks results', async () => {
  const result = await server.client.callTool({ name: 'alg-search-specialists', arguments: { query: 'pull request' } });
  assert.match(text(result), /1\. \*\*Blake\*\*/);
});

test('cache tools report and clear the shared cache', async () => {
  const stats = await server.client.callTool({ name: 'alg-cache-stats', arguments: {} });
  assert.match(text(stats), /DOCS/);
  assert.doesNotMatch(text(stats), /N\/A%/);

  const cleared = await server.client.callTool({ name: 'alg-clear-cache', arguments: { source: 'docs' } });
  assert.ok(!cleared.isError);
});

test('discussion search without a token explains what is missing', async () => {
  const result = await server.client.callTool({ name: 'alg-search-discussions', arguments: { query: 'release' } });
  assert.ok(result.isError);
  assert.match(text(result), /requires a valid GitHub token/);
});

test('invalid tool input is rejected', async () => {
  const result = await server.client.callTool({ name: 'alg-search-docs', arguments: { query: 'x', limit: -1 } })
    .catch(error => ({ isError: true, error }));
  assert.ok(result.isError);
});

test('stdout carries only JSON-RPC', () => {
  assert.deepEqual(server.transportErrors, []);
});

test('agent files are not written by default', () => {
  assert.equal(fs.existsSync(server.fake.promptsDir), false);
});

test('agent files are written when AL_GO_MCP_INSTALL_AGENTS=true', async () => {
  const optedIn = await startServer({ AL_GO_MCP_INSTALL_AGENTS: 'true' });
  try {
    // Files are written right after connecting; poll briefly
    for (let i = 0; i < 50 && !(fs.existsSync(optedIn.fake.promptsDir) && fs.readdirSync(optedIn.fake.promptsDir).length >= 16); i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const files = fs.readdirSync(optedIn.fake.promptsDir);
    assert.equal(files.filter(f => /^alg-[a-z]+\.agent\.md$/.test(f)).length, 16);
  } finally {
    await optedIn.client.close();
    fs.rmSync(optedIn.fake.home, { recursive: true, force: true });
  }
});
