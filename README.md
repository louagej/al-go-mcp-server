# AL-Go MCP Server

A Model Context Protocol (MCP) server that provides intelligent access to [AL-Go](https://github.com/microsoft/AL-Go) documentation, workflows, and domain expertise for Business Central development automation.

## Repository

🔗 **GitHub Repository**: [https://github.com/louagej/al-go-mcp-server](https://github.com/louagej/al-go-mcp-server)
📦 **npm Package**: [https://www.npmjs.com/package/al-go-mcp-server](https://www.npmjs.com/package/al-go-mcp-server)

## Features

- **Domain Specialists**: 16 AL-Go expert profiles covering every major workflow area (app creation, CI/CD, release management, testing, deployment, and more)
- **Knowledge Integration**: Links specialists to AL-Go scenarios, workshop content, GitHub Discussions, and resolved Issues
- **Semantic Search**: Cross-source intelligent search with TF-IDF relevance ranking across all knowledge sources
- **Knowledge Graph**: Visualize relationships between specialists and knowledge sources, with cluster detection
- **Smart Caching**: Per-source TTL caching (workshop/scenario: 24h, discussion: 6h, issue: 12h) with hit/miss statistics
- **AL-Go Documentation**: Search through comprehensive AL-Go guides and workflow templates
- **Optional Authentication**: GitHub token support for higher rate limits and full API access

## Installation

### With npm

```bash
# Install globally for command line usage
npm install -g al-go-mcp-server

# Or use directly with npx (no installation required)
npx al-go-mcp-server
```

## Usage

### VS Code with MCP Extension (Recommended)

You can configure the AL-Go MCP server in two ways:

#### Option 1: User Settings (Recommended)

Add to your **User MCP Configuration** for access across all projects in the same VS Code profile:

> **Note**: User settings are profile-specific. The server will be available for all projects opened with the same VS Code profile (e.g., "Node.js", "Default", etc.).

1. Open VS Code Command Palette (`Ctrl+Shift+P`)
2. Run **"MCP: Open User Configuration"**
3. Add the server configuration:

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "al-go-mcp-server@latest"]
    }
  },
  "inputs": []
}
```

#### Option 2: Project Settings

Add to your project's `.vscode/mcp.json` for project-specific configuration:

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "al-go-mcp-server@latest"]
    }
  }
}
```

### With GitHub Authentication (Recommended)

Provide a GitHub token for higher rate limits, and to enable discussion and issue search:

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "al-go-mcp-server@latest"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Command Line (Advanced)

```bash
# If installed globally
al-go-mcp-server

# Or using npx (no installation needed, always latest)
npx --yes al-go-mcp-server@latest
```

## Available Tools

### Documentation

| Tool | Description |
|------|-------------|
| `alg-search-docs` | Search AL-Go documentation and guides |
| `alg-get-workflows` | Get AL-Go workflow templates and examples |
| `alg-refresh-cache` | Force refresh of cached documentation |

### Specialists

| Tool | Description |
|------|-------------|
| `alg-search-specialists` | Find domain specialists by keyword, persona name, or expertise area |
| `alg-list-specialists` | Browse all 16 AL-Go domain specialists |
| `alg-get-specialist` | Get detailed profile for a specific specialist |
| `alg-ask` | Ask a specialist by persona name — routes your question with avatar context |

> **Tip:** Address specialists directly in chat: `alg-freddy my dev environment can't be reached` — Copilot will call `alg-ask` and Freddy responds with his avatar and expertise.

### Knowledge Sources

| Tool | Description |
|------|-------------|
| `alg-get-scenarios` | Fetch AL-Go scenario files from the repository |
| `alg-search-discussions` | Search GitHub Discussions for community Q&A |
| `alg-search-issues` | Search resolved GitHub Issues for tips and workarounds |
| `alg-get-specialist-knowledge` | Get all knowledge sources linked to a specialist |
| `alg-build-knowledge-graph` | Build the complete specialist–knowledge graph |

### Advanced

| Tool | Description |
|------|-------------|
| `alg-semantic-search` | Cross-source intelligent search with relevance ranking |
| `alg-graph-visualization` | Visualize specialist relationships (JSON or text format) |
| `alg-cache-stats` | View cache hit/miss rates and TTL configuration |
| `alg-clear-cache` | Clear all, expired, or source-specific cache entries |

> **Note**: Tools in the Knowledge Sources and Advanced groups that call the GitHub API require a `GITHUB_TOKEN` to be set for full functionality.

## Domain Specialists

The server includes 16 AL-Go domain specialists, each with mapped expertise, keywords, related scenarios, and related workflows:

| Name | Specialist | Focus Area | Sample Chat |
|------|------------|------------|-------------|
| **Freddy**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Freddy&size=80" alt="Freddy"> | Online Dev Environment Specialist | Create and manage cloud-based dev environments | `alg-freddy my codespace won't start after the latest AL-Go update` |
| **Riley**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Riley&size=80" alt="Riley"> | Release Manager Specialist | Handle release creation and versioning strategies | `alg-riley how do I create a hotfix release for v2.1.3?` |
| **Drew**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Drew&size=80" alt="Drew"> | Documentation Publisher Specialist | Deploy and manage reference documentation | `alg-drew my reference docs aren't publishing to GitHub Pages` |
| **Vera**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Vera&size=80" alt="Vera"> | Version Updater Specialist | Manage version number increments and semantic versioning | `alg-vera how do I bump the major version across all my apps?` |
| **Ethan**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Ethan&size=80" alt="Ethan"> | Environment Publisher Specialist | Publish Business Central apps to environments | `alg-ethan my app isn't deploying to the sandbox environment` |
| **Tara**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Tara&size=80" alt="Tara"> | Current Version Test Specialist | Run and manage tests against the current version | `alg-tara some tests are failing in the current version CI run` |
| **Axel**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Axel&size=80" alt="Axel"> | App Provisioner Specialist | Add and manage existing or test applications | `alg-axel how do I add an existing app as a dependency?` |
| **Casey**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Casey&size=80" alt="Casey"> | CI/CD Architect Specialist | Configure and optimize CI/CD pipelines | `alg-casey my CI pipeline takes 45 minutes — how can I speed it up?` |
| **Grace**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Grace&size=80" alt="Grace"> | App Generator Specialist | Create new BC applications from templates | `alg-grace how do I scaffold a new BC extension from a template?` |
| **Perry**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Perry&size=80" alt="Perry"> | Performance Test Creator Specialist | Create and manage performance test applications | `alg-perry how do I set up a performance test for my posting routines?` |
| **Tommy**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Tommy&size=80" alt="Tommy"> | Test App Creator Specialist | Create test applications for quality assurance | `alg-tommy I need to create a test app for my new extension` |
| **Blake**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Blake&size=80" alt="Blake"> | PR Build Engineer Specialist | Manage pull request build workflows and validation | `alg-blake PR builds are failing but the main branch builds fine` |
| **Finn**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Finn&size=80" alt="Finn"> | Future Version Tester Specialist | Test applications against next major/minor versions | `alg-finn how do I test my app against the next major BC version?` |
| **Rex**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Rex&size=80" alt="Rex"> | Troubleshooting Specialist | Diagnose and resolve AL-Go issues and problems | `alg-rex my AL-Go workflow is failing with a cryptic error` |
| **Stella**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Stella&size=80" alt="Stella"> | System File Updater Specialist | Update and maintain AL-Go system files | `alg-stella how do I update the AL-Go system files to the latest version?` |
| **Bruno**<br><img src="https://api.dicebear.com/9.x/adventurer/png?seed=Bruno&size=80" alt="Bruno"> | Build Manager Specialist | Manage AL-Go project builds and configurations | `alg-bruno my build artifacts aren't being generated correctly` |

## Development

```bash
# Clone the repository
git clone https://github.com/louagej/al-go-mcp-server.git
cd al-go-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run locally
npm start
```

## Contributing

We welcome contributions from the community! This project is open source and we appreciate all kinds of contributions.

### Quick Start for Contributors

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Build the project**: `npm run build`
4. **Run tests**: `npm test` — all tests must pass before submitting a PR
5. **Make your changes** following our [contribution guidelines](CONTRIBUTING.md)
6. **Submit a pull request** with a clear description

### Contribution Guidelines

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information about:

- Development setup and workflow
- Code style and standards
- Pull request process
- Security guidelines
- Review process

### Security

For security-related issues, please review our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

### Issues and Feature Requests

- **Bug Reports**: Use the issue template and provide detailed reproduction steps
- **Feature Requests**: Describe the feature and its use case clearly
- **Questions**: Use GitHub Discussions for general questions

## License

MIT — see [LICENSE](LICENSE) file for details.

---

**Links:**
- [AL-Go Repository](https://github.com/microsoft/AL-Go)
- [AL-Go Deprecations](https://github.com/microsoft/AL-Go/blob/main/DEPRECATIONS.md)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Business Central AL Development](https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)
