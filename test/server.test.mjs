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
  for (const key of ['AL_GO_MCP_INSTALL_AGENTS', 'AL_GO_MCP_UPDATE_CHECK']) {
    if (!(key in extraEnv)) delete env[key];
  }
  return env;
}

const agentFiles = (dir, pattern) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => pattern.test(f)) : [];
const VSCODE_AGENT = /^alg-[a-z]+\.agent\.md$/;
const CLAUDE_AGENT = /^alg-[a-z]+\.md$/;

async function startServer(extraEnv = {}, { fake = makeFakeHome(), setup } = {}) {
  setup?.(fake);
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

/** Call a cheap tool until one of its results carries a notice, or give up */
async function waitForNotice(client, pattern) {
  for (let i = 0; i < 50; i++) {
    const result = await client.callTool({ name: 'alg-get-server-version', arguments: {} });
    if (pattern.test(text(result))) return result;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return undefined;
}

test('a newer version on the registry is announced once in a tool result', async () => {
  const http = await import('node:http');
  const registry = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ version: req.url === '/al-go-mcp-server/latest' ? '99.0.0' : '0.0.0' }));
  });
  await new Promise(resolve => registry.listen(0, '127.0.0.1', resolve));
  const { port } = registry.address();

  const updated = await startServer({ AL_GO_MCP_UPDATE_CHECK: 'force', npm_config_registry: `http://127.0.0.1:${port}` });
  try {
    const first = await waitForNotice(updated.client, /ℹ️ al-go-mcp-server 99\.0\.0 is available/);
    assert.ok(first, 'expected an update notice');
    assert.match(text(first), /Update check: al-go-mcp-server 99\.0\.0 is available/);

    const next = await updated.client.callTool({ name: 'alg-list-specialists', arguments: {} });
    assert.doesNotMatch(text(next), /ℹ️/, 'the notice is shown only once');
  } finally {
    await updated.client.close();
    registry.close();
    fs.rmSync(updated.fake.home, { recursive: true, force: true });
  }
});

test('the update check can be disabled', async () => {
  const off = await startServer({ AL_GO_MCP_UPDATE_CHECK: 'off' });
  try {
    const result = await off.client.callTool({ name: 'alg-get-server-version', arguments: {} });
    assert.match(text(result), /Update check: disabled/);
  } finally {
    await off.client.close();
    fs.rmSync(off.fake.home, { recursive: true, force: true });
  }
});

test('outdated agent files from an earlier install are refreshed and announced', async () => {
  const fake = makeFakeHome();
  const seedOldAgent = () => {
    fs.mkdirSync(fake.claudeAgentsDir, { recursive: true });
    fs.writeFileSync(path.join(fake.claudeAgentsDir, 'alg-rex.md'), '---\nname: alg-rex\ndescription: "old"\n---\nOld agent without a version marker.\n');
    fs.writeFileSync(path.join(fake.claudeAgentsDir, 'my-own-agent.md'), '---\nname: my-own-agent\n---\nNot ours.\n');
  };

  const first = await startServer({}, { fake, setup: seedOldAgent });
  try {
    const result = await waitForNotice(first.client, /Updated the AL-Go specialist agents for Claude Code/);
    assert.ok(result, 'expected an agent refresh notice');
    assert.equal(agentFiles(fake.claudeAgentsDir, CLAUDE_AGENT).length, 16);
    assert.match(fs.readFileSync(path.join(fake.claudeAgentsDir, 'alg-rex.md'), 'utf8'), /Generated by al-go-mcp-server v\d+\.\d+\.\d+/);
    assert.match(fs.readFileSync(path.join(fake.claudeAgentsDir, 'my-own-agent.md'), 'utf8'), /Not ours/, 'other agents are left alone');
    assert.equal(fs.existsSync(fake.promptsDir), false, 'clients without AL-Go agents are not touched');
  } finally {
    await first.client.close();
  }

  // Files are now current: the next start neither rewrites nor announces anything
  const before = fs.statSync(path.join(fake.claudeAgentsDir, 'alg-rex.md')).mtimeMs;
  const second = await startServer({}, { fake });
  try {
    const result = await second.client.callTool({ name: 'alg-get-server-version', arguments: {} });
    assert.doesNotMatch(text(result), /ℹ️/);
    assert.equal(fs.statSync(path.join(fake.claudeAgentsDir, 'alg-rex.md')).mtimeMs, before);
  } finally {
    await second.client.close();
    fs.rmSync(fake.home, { recursive: true, force: true });
  }
});
