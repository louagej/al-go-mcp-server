# AL-Go MCP Server — Copilot Instructions

This workspace is the **AL-Go MCP Server** project. It provides MCP tools for AL-Go documentation, domain specialists, and knowledge sources.

## Always use `alg-*` tools for AL-Go questions

When the user asks anything related to AL-Go, Business Central CI/CD, or the domain specialists in this server, **always use the `alg-*` tools from the `al-go-docs` MCP server**. Never route AL-Go questions to bc-code-intel or any other MCP server.

Use `#tool-name` syntax to invoke a tool directly.

## Available tools

### Specialists
| Tool | When to use |
|------|-------------|
| `#alg-list-specialists` | User wants to see all 16 AL-Go specialists |
| `#alg-search-specialists` | User searches by keyword, persona name, or expertise |
| `#alg-get-specialist` | User wants the full profile of one specialist by ID |
| `#alg-ask` | User addresses a specialist by persona name (see below) |

### Documentation
| Tool | When to use |
|------|-------------|
| `#alg-search-docs` | User asks about AL-Go documentation or guides |
| `#alg-get-workflows` | User asks for workflow templates or examples |
| `#alg-refresh-cache` | User wants to force-refresh cached docs |

### Knowledge sources
| Tool | When to use |
|------|-------------|
| `#alg-get-scenarios` | User asks about AL-Go scenario files |
| `#alg-search-discussions` | User wants community Q&A from GitHub Discussions |
| `#alg-search-issues` | User wants resolved issues / tips and workarounds |
| `#alg-get-specialist-knowledge` | User wants to see all knowledge linked to a specialist |
| `#alg-build-knowledge-graph` | User wants to initialise the full knowledge graph |

### Advanced
| Tool | When to use |
|------|-------------|
| `#alg-semantic-search` | User wants a cross-source intelligent search |
| `#alg-graph-visualization` | User wants to visualise specialist relationships |
| `#alg-cache-stats` | User asks about cache performance |
| `#alg-clear-cache` | User wants to clear cached data |

## Addressing specialists by persona name

Each specialist has a persona first name. When the user writes `@alg-<persona> <question>` or `alg-<persona> <question>`, call `#alg-ask` immediately with the persona name and the question. **Do not call bc-code-intel tools.**

| Handle | Specialist |
|--------|-----------|
| `@alg-freddy` | Online Dev Environment Specialist |
| `@alg-riley` | Release Manager Specialist |
| `@alg-drew` | Documentation Publisher Specialist |
| `@alg-vera` | Version Updater Specialist |
| `@alg-ethan` | Environment Publisher Specialist |
| `@alg-tara` | Current Version Test Specialist |
| `@alg-axel` | App Provisioner Specialist |
| `@alg-casey` | CI/CD Architect Specialist |
| `@alg-grace` | App Generator Specialist |
| `@alg-perry` | Performance Test Creator Specialist |
| `@alg-tommy` | Test App Creator Specialist |
| `@alg-blake` | PR Build Engineer Specialist |
| `@alg-finn` | Future Version Tester Specialist |
| `@alg-rex` | Troubleshooting Specialist |
| `@alg-stella` | System File Updater Specialist |
| `@alg-bruno` | Build Manager Specialist |

### Example
User types: `@alg-freddy my codespace won't start after the latest AL-Go update`
→ Call `#alg-ask specialist="freddy" question="my codespace won't start after the latest AL-Go update"`
→ Freddy responds with his avatar and expertise context, then answer the question using that context.
