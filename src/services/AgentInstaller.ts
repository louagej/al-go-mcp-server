import fs from "fs";
import os from "os";
import path from "path";
import { Specialist } from "./SpecialistService.js";

/**
 * Chat clients that can host the AL-Go specialists as agents
 */
export type AgentTarget = 'vscode' | 'claude';

export const AGENT_TARGETS: readonly AgentTarget[] = ['vscode', 'claude'];

export interface InstallResult {
  target: AgentTarget;
  dir?: string;
  written: number;
  skipped?: string;
}

/**
 * Detect the VS Code user prompts directory cross-platform.
 * Agent files written here are available globally in all workspaces without touching any project.
 */
export function getVSCodePromptsDir(): string | undefined {
  const home = os.homedir();
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    candidates.push(
      path.join(appData, 'Code', 'User', 'prompts'),
      path.join(appData, 'Code - Insiders', 'User', 'prompts'),
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      path.join(home, 'Library', 'Application Support', 'Code', 'User', 'prompts'),
      path.join(home, 'Library', 'Application Support', 'Code - Insiders', 'User', 'prompts'),
    );
  } else {
    candidates.push(
      path.join(home, '.config', 'Code', 'User', 'prompts'),
      path.join(home, '.config', 'Code - Insiders', 'User', 'prompts'),
    );
  }

  // Return the first candidate whose parent (...\User\) already exists
  return candidates.find(p => fs.existsSync(path.dirname(p)));
}

/**
 * Detect the Claude Code user agents directory (~/.claude/agents, or under
 * CLAUDE_CONFIG_DIR when set). Only returned when Claude Code's config folder exists.
 */
export function getClaudeAgentsDir(): string | undefined {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return fs.existsSync(configDir) ? path.join(configDir, 'agents') : undefined;
}

/**
 * VS Code Copilot Chat agent (.agent.md). `tools` scopes the agent to this
 * server, registered under the name "al-go-docs".
 */
export function renderVSCodeAgent(s: Specialist): string {
  const persona = s.persona ?? s.name;
  return [
    `---`,
    `name: ${s.id}`,
    `description: "AL-Go ${s.name} — Use when asking about ${s.keywords.join(', ')}."`,
    `tools: [al-go-docs/*]`,
    `---`,
    `You are **${persona}**, the AL-Go ${s.name}.`,
    ``,
    `Always start by calling \`#alg-ask\` with \`specialist="${persona.toLowerCase()}"\` and the user's question to get your expert context, then answer using that context.`,
    ``,
    `## Expertise`,
    s.expertise.map(e => `- ${e}`).join('\n'),
  ].join('\n');
}

/**
 * Claude Code subagent. Claude reads `description` to decide when to delegate,
 * so it states the domain and trigger topics. No `tools` field: the subagent
 * inherits the session's tools, so it can use this MCP server whatever name it
 * was registered under, and read the user's AL-Go settings files.
 */
export function renderClaudeAgent(s: Specialist): string {
  const persona = s.persona ?? s.name;
  const description = `AL-Go for GitHub ${s.name} (${persona}). ${s.description}. ` +
    `Use for AL-Go questions about ${s.keywords.join(', ')}.`;
  return [
    `---`,
    `name: ${s.id}`,
    `description: ${JSON.stringify(description)}`,
    `---`,
    `You are **${persona}**, the AL-Go ${s.name}: an expert in AL-Go for GitHub, Microsoft's DevOps templates for Business Central extensions.`,
    ``,
    `1. Call the \`alg-ask\` tool from the AL-Go MCP server with \`specialist="${persona.toLowerCase()}"\` and the question, to load your expert context.`,
    `2. Ground your answer in the AL-Go documentation: use \`alg-search-docs\` (and \`alg-search-issues\` for known problems and workarounds), and cite the documents you used with their GitHub links.`,
    `3. When the question concerns the user's repository, read its AL-Go settings (\`.github/AL-Go-Settings.json\`, \`.AL-Go/settings.json\`) and workflows before answering.`,
    ``,
    `Answer in first person as ${persona}. If the question is outside your expertise, say which AL-Go specialist would fit better.`,
    ``,
    `## Expertise`,
    s.expertise.map(e => `- ${e}`).join('\n'),
  ].join('\n');
}

const TARGETS: Record<AgentTarget, { dir: () => string | undefined; render: (s: Specialist) => string; fileName: (s: Specialist) => string; client: string }> = {
  vscode: { dir: getVSCodePromptsDir, render: renderVSCodeAgent, fileName: s => `${s.id}.agent.md`, client: 'VS Code user directory' },
  claude: { dir: getClaudeAgentsDir, render: renderClaudeAgent, fileName: s => `${s.id}.md`, client: 'Claude Code config directory' },
};

/**
 * Parse an AL_GO_MCP_INSTALL_AGENTS / --install-agents value: "true" or "all"
 * means every client, otherwise a comma-separated list such as "claude" or "vscode,claude".
 */
export function parseAgentTargets(value: string | undefined): AgentTarget[] {
  if (!value) return [];
  const parts = value.toLowerCase().split(',').map(p => p.trim()).filter(Boolean);
  if (parts.some(p => p === 'true' || p === 'all')) return [...AGENT_TARGETS];
  return AGENT_TARGETS.filter(t => parts.includes(t));
}

/**
 * Write one agent file per specialist for each target client that is installed.
 * Existing files are overwritten so they follow the specialist data of this version.
 */
export function installAgents(specialists: Specialist[], targets: AgentTarget[]): InstallResult[] {
  return targets.map(target => {
    const { dir: findDir, render, fileName, client } = TARGETS[target];
    const dir = findDir();
    if (!dir) {
      return { target, written: 0, skipped: `${client} not found` };
    }
    try {
      fs.mkdirSync(dir, { recursive: true });
      for (const s of specialists) {
        fs.writeFileSync(path.join(dir, fileName(s)), render(s), 'utf8');
      }
      return { target, dir, written: specialists.length };
    } catch (err) {
      return { target, dir, written: 0, skipped: err instanceof Error ? err.message : String(err) };
    }
  });
}

export function formatInstallResults(results: InstallResult[]): string {
  return results
    .map(r => r.skipped
      ? `${r.target}: skipped (${r.skipped})`
      : `${r.target}: wrote ${r.written} specialist agents to ${r.dir}`)
    .join('\n');
}
