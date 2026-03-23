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
| `search-al-go-docs` | Search AL-Go documentation and guides |
| `get-al-go-workflows` | Get AL-Go workflow templates and examples |
| `refresh-al-go-cache` | Force refresh of cached documentation |

### Specialists

| Tool | Description |
|------|-------------|
| `search-specialists` | Find domain specialists by keyword or expertise area |
| `list-specialists` | Browse all 16 AL-Go domain specialists |
| `get-specialist` | Get detailed profile for a specific specialist |

### Knowledge Sources

| Tool | Description |
|------|-------------|
| `get-scenarios` | Fetch AL-Go scenario files from the repository |
| `search-discussions` | Search GitHub Discussions for community Q&A |
| `search-issues` | Search resolved GitHub Issues for tips and workarounds |
| `get-specialist-knowledge` | Get all knowledge sources linked to a specialist |
| `build-knowledge-graph` | Build the complete specialist–knowledge graph |

### Advanced

| Tool | Description |
|------|-------------|
| `semantic-search` | Cross-source intelligent search with relevance ranking |
| `graph-visualization` | Visualize specialist relationships (JSON or text format) |
| `cache-stats` | View cache hit/miss rates and TTL configuration |
| `clear-cache` | Clear all, expired, or source-specific cache entries |

> **Note**: Tools in the Knowledge Sources and Advanced groups that call the GitHub API require a `GITHUB_TOKEN` to be set for full functionality.

## Domain Specialists

The server includes 16 AL-Go domain specialists, each with mapped expertise, keywords, related scenarios, and related workflows:

| Specialist | Focus Area |
|------------|------------|
| App Generator Specialist | Create new BC applications from templates |
| App Provisioner Specialist | Add and manage existing or test applications |
| Build Manager Specialist | Manage AL-Go project builds and configurations |
| CI/CD Architect Specialist | Configure and optimize CI/CD pipelines |
| Current Version Test Specialist | Run and manage tests against the current version |
| Documentation Publisher Specialist | Deploy and manage reference documentation |
| Environment Publisher Specialist | Publish Business Central apps to environments |
| Future Version Tester Specialist | Test applications against next major/minor versions |
| Online Dev Environment Specialist | Create and manage cloud-based dev environments |
| Performance Test Creator Specialist | Create and manage performance test applications |
| PR Build Engineer Specialist | Manage pull request build workflows and validation |
| Release Manager Specialist | Handle release creation and versioning strategies |
| System File Updater Specialist | Update and maintain AL-Go system files |
| Test App Creator Specialist | Create test applications for quality assurance |
| Troubleshooting Specialist | Diagnose and resolve AL-Go issues and problems |
| Version Updater Specialist | Manage version number increments and semantic versioning |

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
