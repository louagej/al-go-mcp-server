# AL-Go MCP Server

A Model Context Protocol (MCP) server that provides access to AL-Go documentation and resources from the [microsoft/AL-Go](https://github.com/microsoft/AL-Go) repository.

## Repository

🔗 **GitHub Repository**: [https://github.com/louagej/al-go-mcp-server](https://github.com/louagej/al-go-mcp-server)  
📦 **npm Package**: [https://www.npmjs.com/package/al-go-mcp-server](https://www.npmjs.com/package/al-go-mcp-server)

## Features

- 🔍 **Search AL-Go Documentation**: Search through comprehensive AL-Go guides and documentation
- 📋 **Workflow Examples**: Access and explore AL-Go workflow templates and examples  
- 📖 **Repository Navigation**: Browse AL-Go repository contents and resources
- ⚡ **Performance Optimized**: Cached responses and efficient GitHub API usage
- 🔐 **Optional Authentication**: Support for GitHub tokens for higher rate limits
- 🚀 **Easy Installation**: Available via npm and npx for instant usage

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

### With GitHub Authentication (Optional)

For higher rate limits and better performance, provide a GitHub token. This can be added to either user or project settings:

**User Settings** (add `env` to the server configuration):
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
  },
  "inputs": []
}
```

**Project Settings** (`.vscode/mcp.json`):
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

### Command Line (Advandced)

```bash
# If installed globally
al-go-mcp-server

# Or using npx (no installation needed, always latest)
npx --yes al-go-mcp-server@latest

# Check version
npx --yes al-go-mcp-server@latest --version
```


## Available Tools

When connected, the server provides these tools:

- **`search-al-go-docs`**: Search through AL-Go documentation with queries
- **`get-al-go-workflows`**: Get examples of AL-Go GitHub workflows  
- **`refresh-al-go-cache`**: Refresh cached documentation (force update)

## Development

```bash
# Clone the repository
git clone https://github.com/louagej/al-go-mcp-server.git
cd al-go-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start
# or
npx tsx src/index.ts
```

## Contributing

We welcome contributions from the community! This project is open source and we appreciate all kinds of contributions.

### 🚀 Quick Start for Contributors

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Build the project**: `npm run build`
4. **Make your changes** following our [contribution guidelines](CONTRIBUTING.md)
5. **Submit a pull request** with a clear description

### 📋 Contribution Guidelines

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information about:

- Development setup and workflow
- Code style and standards
- Pull request process
- Security guidelines
- Review process

### 🔒 Security

For security-related issues, please review our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

### 🐛 Issues and Feature Requests

- **Bug Reports**: Use the issue template and provide detailed reproduction steps
- **Feature Requests**: Describe the feature and its use case clearly
- **Questions**: Use GitHub Discussions for general questions

### 👥 Community

- All contributors are expected to follow our code of conduct
- Be respectful and constructive in all interactions
- Help maintain a welcoming environment for everyone

## License

MIT - see [LICENSE](LICENSE) file for details.

---

**Links:**
- [AL-Go Repository](https://github.com/microsoft/AL-Go)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Business Central AL Development](https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)