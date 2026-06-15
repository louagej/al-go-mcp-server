# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).









## [2.8.0] - 2026-06-15

### Added
- update PAT

### Changed
- update PAT

### Fixed
- `create-release` workflow failing on checkout due to Node.js 20 action deprecation enforcement
- --
- ## Checklist
- [ ] ✅ Built successfully (`npm run build`)
- [ ] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [ ] ✅ No sensitive information committed
- [ ] ✅ README updated (if applicable)
- `create-release` workflow checkout failure caused by `actions/checkout@v6` regression in explicit-token credential handling
- 7 npm transitive dependency vulnerabilities (5 moderate, 2 high) detected by `npm audit --audit-level=moderate` in `hono`, `@hono/node-server`, `fast-uri`, `path-to-regexp`, `ip-address`, and `qs`
- [x] ✅ Built successfully (`npm run build`)
- [x] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [x] ✅ No sensitive information committed
- CI build failure: `TS5101` error from TypeScript 6 deprecating `baseUrl` without `ignoreDeprecations`
- CI build failure: `TS2591` errors from missing Node.js ambient types under TypeScript 6 `Node16` module resolution
- CI engine mismatch warnings: Node 18 → 20 to satisfy `@octokit` `>=20` engine requirement
- [x] ✅ README updated (if applicable)
- <!-- START COPILOT ORIGINAL PROMPT -->
- <details>
- <summary>Original prompt</summary>
- > Fix CI workflow failure in `louagej/al-go-mcp-server`.
- >
- > Context: GitHub Actions run failed (job 72078806320, ref `5020d41a7a7ec5569aecae9a2d62d3a0e68c1974`). Logs show:
- > - TypeScript build error: `tsconfig.json(17,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.`
- > - Node engine warnings: dependencies require Node `>= 20` but CI is using Node `v18.20.8`.
- > Tasks:
- > 1) Update the CI workflow at `.github/workflows/ci.yml` to use Node.js 20 (or newer LTS, preferably 20) via `actions/setup-node`.
- > 2) Update `tsconfig.json` to add `"ignoreDeprecations": "6.0"` under `compilerOptions` to silence TS5101 and allow the build to succeed under TypeScript 6.
- > 3) Ensure `npm ci` / `npm install` and `npm run build` succeed in CI after changes.
- > Constraints:
- > - Keep changes minimal and focused on fixing the CI failure.
- > - Do not refactor unrelated code.
- > PR base branch: `main`.
- > The following is the prior conversation context from the user's chat exploration (may be truncated):
- > User: The cicd workflow failed of my al-go-mcp server: https://github.com/louagej/al-go-mcp-server/actions/runs/24652696711/job/72078806320
- > Can you try to fix this?
- > Assistant: The failure is coming from TypeScript 6 treating `compilerOptions.baseUrl` as a *deprecated option* and turning it into an error:
- > - `tsconfig.json(17,5): error TS5101: Option 'baseUrl' is deprecated ... Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.`
- > (ref: `5020d41a7a7ec5569aecae9a2d62d3a0e68c1974`)
- > You also have Node engine warnings because the workflow is running Node **18.20.8** while some deps require **Node >= 20**:
- > - `npm warn EBADENGINE ... required: { node: '>= 20' } current: { node: 'v18.20.8' ... }`
- > ### What to change
- > 1) **Fix the TS build error** by adding this to `compilerOptions` in `tsconfig.json`:
- > ```json
- > "ignoreDeprecations": "6.0"
- > ```
- > (That’s exactly what the error message is asking for.)
- > 2) **Fix the Node engine mismatch** by updating the GitHub Actions workflow to use **Node 20** (or 22) instead of 18 (usually in `actions/setup-node`’s `node-version:`).
- > ### I can apply the fix for you
- > Do you want me to open a PR in `louagej/al-go-mcp-server` that:
- > - updates `.github/workflows/ci.yml` to use Node 20, and
- > - updates `tsconfig.json` to add `"ignoreDeprecations": "6.0"`?
- > If yes, tell me which base branch to target (e.g. `main`).
- > User: main
- > Assistant: I’ve kicked off creating a PR against `main` with the CI fixes (switch CI to Node 20 and add `"ignoreDeprecations": "6.0"` in `tsconfig.json`)
- I’m waiting for your approval in the confirmation dialog to proceed.
- </details>
- <!-- START COPILOT CODING AGENT SUFFIX -->
- This pull request was created from Copilot chat.*

## [2.7.0] - 2026-03-23

### Added
- PR body parsing in Create Release workflow — `### Added`, `### Changed`, `### Fixed` sections are automatically extracted as release notes when manual inputs are left blank

### Changed
- Checkout step now always uses `GITHUB_TOKEN` instead of a PAT token fallback
- Push step sets the remote URL with the appropriate token (`PAT_TOKEN` if set, otherwise `GITHUB_TOKEN`) immediately before pushing
- Release notes now aggregate all PR bodies merged since the last release tag (previously only the latest PR was included)
- Duplicate changelog entries across multiple PRs are automatically deduplicated
- PR template updated to align with release workflow format, using `### Added / ### Changed / ### Fixed` sections
- `bootstrapAgentFiles()` now includes `name:` frontmatter field in generated `.agent.md` files

### Fixed
- `fatal: could not read Username` error when running the Create Release workflow caused by an invalid or expired `PAT_TOKEN` being used for checkout
- --
- ## Checklist
- [ ] ✅ Built successfully (`npm run build`)
- [ ] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [ ] ✅ No sensitive information committed
- [ ] ✅ README updated (if applicable)
- Added missing `name:` frontmatter field to all 16 `.github/agents/alg-*.agent.md` files — required by VS Code for `@alg-*` handles to appear in the Copilot Chat agent picker
- [x] ✅ Built successfully (`npm run build`)
- [x] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [x] ✅ No sensitive information committed

## [2.6.0] - 2026-03-23

### Added
- PR body parsing in Create Release workflow — `### Added`, `### Changed`, `### Fixed` sections are automatically extracted as release notes when manual inputs are left blank

### Changed
- Checkout step now always uses `GITHUB_TOKEN` instead of a PAT token fallback
- Push step sets the remote URL with the appropriate token (`PAT_TOKEN` if set, otherwise `GITHUB_TOKEN`) immediately before pushing
- Release notes now aggregate all PR bodies merged since the last release tag (previously only the latest PR was included)
- Duplicate changelog entries across multiple PRs are automatically deduplicated
- PR template updated to align with release workflow format, using `### Added / ### Changed / ### Fixed` sections
- `bootstrapAgentFiles()` now includes `name:` frontmatter field in generated `.agent.md` files

### Fixed
- `fatal: could not read Username` error when running the Create Release workflow caused by an invalid or expired `PAT_TOKEN` being used for checkout
- --
- ## Checklist
- [ ] ✅ Built successfully (`npm run build`)
- [ ] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [ ] ✅ No sensitive information committed
- [ ] ✅ README updated (if applicable)
- Added missing `name:` frontmatter field to all 16 `.github/agents/alg-*.agent.md` files — required by VS Code for `@alg-*` handles to appear in the Copilot Chat agent picker
- [x] ✅ Built successfully (`npm run build`)
- [x] ✅ Tests pass (`node test/test-functionality.mjs && node test/test-phase2.mjs`)
- [x] ✅ No sensitive information committed

## [2.5.0] - 2026-03-23

### Added
- Writes `alg-<persona>.agent.md` for all 16 specialists to the user prompts directory on startup
- non-fatal if the directory cannot be resolved or written

### Changed
- `main()` now calls `bootstrapAgentFiles()` immediately after `server.connect()`

### Fixed
- Resolved compile error in `bootstrapAgentFiles` — replaced out-of-scope `getSpecialistService()` call with `new SpecialistService()`

## [2.4.0] - 2026-03-23

### Added
- 16 VS Code agent files (.github/agents/alg-*.agent.md) enabling @alg- addressing in Copilot Chat for all 16 specialists
- Each agent displays the specialist avatar at the start of every response
- Each agent is scoped to al-go-docs/* MCP tools only

### Changed
- README: added disclaimer that all persona names and avatars are fictional and do not represent any real individual

## [2.3.0] - 2026-03-23

### Added
- None

### Changed
- Rename specialist IDs to persona-based handles (`@alg-freddy`, `@alg-casey`, ...)

### Fixed
- None

## [2.2.0] - 2026-03-23

### Added
- Addressing specialists based on question content

### Changed
- Registering remaining commands with prefix

## [2.1.0] - 2026-03-23

### Added
- Persona names for all 16 specialists (Freddy, Riley, Drew, Vera, Ethan, Tara, Axel, Casey, Grace, Perry, Tommy, Blake, Finn, Rex, Stella, Bruno) — inspired by the AL-Go community, with Freddy honouring the AL-Go founder
- DiceBear avatar for every specialist, rendered in tool responses and the README
- `alg-ask` tool — address any specialist by persona name in chat (e.g. `alg-freddy my dev environment can't be reached`), response opens with avatar and expertise context
- `alg-` prefix added to all 16 specialist IDs for namespace consistency with tool naming
- Sample chat message column added to the Domain Specialists table in README

### Changed
- All 12 generic tool names prefixed with `alg-` to prevent conflicts with other MCP servers such as bc-code-intel that register tools with the same names
- `alg-search-specialists` now also matches on persona name
- Domain Specialists table in README now shows avatar, name, specialist role, focus area, and a sample chat prompt per row
- Test suite expanded from 10 to all 17 registered tools, grouped by phase

### Fixed
- Switched avatar source from Multiavatar SVG (blocked by GitHub Content Security Policy) to DiceBear PNG which renders reliably in GitHub Markdown
- `alg-search-specialists` description now correctly lists persona as a searchable field
- CHANGELOG v2.0.0 entries updated to use the correct `alg-*` tool names

## [2.0.0] - 2026-03-23

### Added
- 16 AL-Go domain specialists with mapped expertise, keywords, and related scenarios/workflows (App Generator, Build Manager, CI/CD Architect, Deploy Helper, Release Manager, and 11 more)
- `alg-search-specialists` tool — find specialists by name, persona, keyword, or expertise area
- `alg-list-specialists` tool — browse all domain specialists
- `alg-get-specialist` tool — get full profile for a specific specialist
- `alg-search-discussions` tool — search GitHub Discussions for community Q&A
- `alg-get-scenarios` tool — fetch AL-Go scenario files from the repository
- `alg-search-issues` tool — search resolved GitHub Issues for tips and workarounds
- `alg-get-specialist-knowledge` tool — retrieve all knowledge sources linked to a specialist
- `alg-build-knowledge-graph` tool — build the complete specialist–knowledge graph
- `alg-semantic-search` tool — cross-source intelligent search with TF-IDF relevance ranking
- `alg-graph-visualization` tool — visualize specialist relationships in JSON or text format
- `alg-cache-stats` tool — view cache hit/miss rates and per-source TTL configuration
- `alg-clear-cache` tool — clear all, expired, or source-specific cache entries
- Persona names and DiceBear avatars for all 16 specialists
- Automated tests in `test/` that run on every CI build and pull request

### Changed
- Extended `AlGoService` with scenario, workshop, and issue fetching methods
- Caching now uses configurable per-source TTLs (workshop/scenario: 24 h, discussion: 6 h, issue: 12 h)
- Release workflow supports `Added`, `Changed`, and `Fixed` changelog sections instead of a single one-liner
- GitHub Release creation migrated from deprecated `actions/create-release@v1` to `softprops/action-gh-release@v2`
- README updated to document all 14 tools, specialist list, and authentication requirements

## [1.1.0] - 2025-12-22

### Changed
- update npm version

## [1.0.12] - 2025-12-01

### Changed
- security patch

## [1.0.11] - 2025-09-28

### Changed
- update npx command to always use the latest version and streamline version retrieval from package.json

## [1.0.10] - 2025-09-28

### Changed
- Enhance startup message to include server version

## [1.0.9] - 2025-09-28

### Changed
- add version info on start

## [1.0.8] - 2025-09-28

### Changed
- use PAT

## [1.0.7] - 2025-09-20

### Changed
- added NPM_TOKEN

## [1.0.6] - 2025-09-20

### Changed
- Added repository field to package.json - This is required for trusted publishing

## [1.0.5] - 2025-09-20

### Changed
- Added provenance flag on npm publish

## [1.0.4] - 2025-09-20

### Changed
- Added id-token write permissions

## [1.0.3] - 2025-09-17

### Changed
- ix: Prevent startup messages when using --version or --help flags

## [1.0.2] - 2025-09-17

### Changed
- feat: Add --version and --help command line arguments

## [1.0.1] - 2025-09-17

### Changed
- Create Automated Release

## [1.0.0] - 2024-09-17

### Added
- Initial release of AL-Go MCP Server
- Search functionality for AL-Go documentation
- Access to AL-Go workflow examples
- GitHub API integration with optional authentication
- Caching for improved performance
- Support for both user and project-level VS Code MCP configuration
- npm package with npx support

### Features
- `alg-search-docs` tool for searching AL-Go documentation
- `alg-get-workflows` tool for accessing workflow examples
- `alg-refresh-cache` tool for cache management
- Profile-aware VS Code integration
- Optional GitHub token authentication for higher rate limits

[1.0.0]: https://github.com/louagej/al-go-mcp-server/releases/tag/v1.0.0