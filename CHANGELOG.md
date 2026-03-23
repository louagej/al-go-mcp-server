# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).




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