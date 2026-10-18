// Starts the built server over stdio, the way an MCP client does, and exercises
// the tools that work offline. Network-backed tools are covered by unit tests
// with fake sources instead.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../build/index.js', import.meta.url));

/**
 * Create a fake home where VS Code and Claude Code look installed, so we can
 * check whether the server writes agent files into them
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
  fs.mkdirSync(path.join(home, '.claude'));
  return { home, appData, promptsDir: path.join(userDir, 'prompts'), claudeAgentsDir: path.join(home, '.claude', 'agents') };
}

function fakeEnv(fake, extraEnv = {}) {
  const env = { ...process.env, HOME: fake.home, USERPROFILE: fake.home, APPDATA: fake.appData, ...extraEnv };
  delete env.GITHUB_TOKEN;
  delete env.AL_GO_MCP_GITHUB_TOKEN;
  delete env.CLAUDE_CONFIG_DIR;
  return env;
}

const agentFiles = (dir, pattern) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => pattern.test(f)) : [];
const VSCODE_AGENT = /^alg-[a-z]+\.agent\.md$/;
const CLAUDE_AGENT = /^alg-[a-z]+\.md$/;

async function startServer(extraEnv = {}) {
  const fake = makeFakeHome();
  const env = fakeEnv(fake, extraEnv);

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
  assert.equal(fs.existsSync(server.fake.claudeAgentsDir), false);
});

test('AL_GO_MCP_INSTALL_AGENTS=true installs agents for VS Code and Claude Code', async () => {
  const optedIn = await startServer({ AL_GO_MCP_INSTALL_AGENTS: 'true' });
  try {
    // Files are written right after connecting; poll briefly
    for (let i = 0; i < 50 && agentFiles(optedIn.fake.claudeAgentsDir, CLAUDE_AGENT).length < 16; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(agentFiles(optedIn.fake.promptsDir, VSCODE_AGENT).length, 16);
    assert.equal(agentFiles(optedIn.fake.claudeAgentsDir, CLAUDE_AGENT).length, 16);
  } finally {
    await optedIn.client.close();
    fs.rmSync(optedIn.fake.home, { recursive: true, force: true });
  }
});

test('--install-agents=claude installs only Claude Code agents and exits', () => {
  const fake = makeFakeHome();
  try {
    const output = execFileSync(process.execPath, [serverPath, '--install-agents=claude'], { env: fakeEnv(fake), encoding: 'utf8' });
    assert.match(output, /claude: wrote 16 specialist agents/);
    assert.equal(agentFiles(fake.claudeAgentsDir, CLAUDE_AGENT).length, 16);
    assert.equal(fs.existsSync(fake.promptsDir), false);
  } finally {
    fs.rmSync(fake.home, { recursive: true, force: true });
  }
});

test('--install-agents skips clients that are not installed', () => {
  const fake = makeFakeHome();
  fs.rmSync(path.join(fake.home, '.claude'), { recursive: true });
  try {
    const output = execFileSync(process.execPath, [serverPath, '--install-agents'], { env: fakeEnv(fake), encoding: 'utf8' });
    assert.match(output, /vscode: wrote 16/);
    assert.match(output, /claude: skipped \(Claude Code config directory not found\)/);
  } finally {
    fs.rmSync(fake.home, { recursive: true, force: true });
  }
});
