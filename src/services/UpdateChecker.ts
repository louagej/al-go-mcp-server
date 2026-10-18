import path from "path";

/**
 * How this server process was installed, which decides how to update it
 */
export type InstallMethod = 'npx' | 'installed' | 'source';

export function detectInstallMethod(moduleDir: string): InstallMethod {
  const parts = path.resolve(moduleDir).split(path.sep);
  if (parts.includes('_npx')) return 'npx';
  if (parts.includes('node_modules')) return 'installed';
  return 'source';
}

/**
 * True when `latest` is a higher release than `current` (x.y.z; pre-releases are never offered)
 */
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => /^\d+\.\d+\.\d+$/.test(v) ? v.split('.').map(Number) : undefined;
  const a = parse(latest);
  const b = parse(current.replace(/-.*$/, ''));
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

/**
 * Ask the npm registry for the `latest` version. Returns it only when it is newer
 * than `current`; any failure (offline, proxy, timeout) is treated as "no update".
 */
export async function checkForUpdate(
  packageName: string,
  current: string,
  options: { registry?: string; timeoutMs?: number; fetchImpl?: typeof fetch } = {}
): Promise<string | undefined> {
  const registry = (options.registry || 'https://registry.npmjs.org').replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(`${registry}/${packageName}/latest`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 3000),
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return undefined;
    const { version } = await response.json() as { version?: string };
    return version && isNewerVersion(version, current) ? version : undefined;
  } catch {
    return undefined;
  }
}

export function formatUpdateNotice(packageName: string, current: string, latest: string, method: InstallMethod): string {
  const action = method === 'npx'
    ? `restart the MCP server to update (make sure its configuration uses \`${packageName}@latest\`)`
    : `run \`npm install -g ${packageName}@latest\` and restart the MCP server`;
  return `${packageName} ${latest} is available (you have ${current}): ${action}.`;
}
