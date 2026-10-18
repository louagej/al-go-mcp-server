import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentTargets, renderClaudeAgent, renderVSCodeAgent } from '../build/services/AgentInstaller.js';
import { SpecialistService } from '../build/services/SpecialistService.js';

const specialists = new SpecialistService().getAll();

/** Minimal frontmatter parser: `key: value` lines between the first two `---` */
function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'file must start with a frontmatter block');
  return Object.fromEntries(match[1].split('\n').map(line => {
    const i = line.indexOf(':');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }));
}

test('parseAgentTargets', () => {
  assert.deepEqual(parseAgentTargets(undefined), []);
  assert.deepEqual(parseAgentTargets(''), []);
  assert.deepEqual(parseAgentTargets('false'), []);
  assert.deepEqual(parseAgentTargets('true'), ['vscode', 'claude']);
  assert.deepEqual(parseAgentTargets('all'), ['vscode', 'claude']);
  assert.deepEqual(parseAgentTargets('claude'), ['claude']);
  assert.deepEqual(parseAgentTargets('Claude, VSCode'), ['vscode', 'claude']);
});

test('Claude Code agents have a valid name and a quoted, single-line description', () => {
  for (const s of specialists) {
    const meta = frontmatter(renderClaudeAgent(s));
    assert.equal(meta.name, s.id);
    assert.match(meta.name, /^[a-z0-9-]+$/, 'Claude Code agent names are lowercase with hyphens');
    const description = JSON.parse(meta.description);
    assert.match(description, new RegExp(`\\(${s.persona}\\)`));
    assert.ok(!('tools' in meta), 'Claude agents inherit tools so the MCP server name does not matter');
  }
});

test('Claude Code agents instruct the specialist to call alg-ask for its own persona', () => {
  const riley = specialists.find(s => s.persona === 'Riley');
  const body = renderClaudeAgent(riley);
  assert.match(body, /`alg-ask`[^\n]*specialist="riley"/);
  assert.match(body, /alg-search-docs/);
});

test('VS Code agents keep their existing format', () => {
  const freddy = specialists.find(s => s.persona === 'Freddy');
  const meta = frontmatter(renderVSCodeAgent(freddy));
  assert.equal(meta.name, 'alg-freddy');
  assert.equal(meta.tools, '[al-go-docs/*]');
});
