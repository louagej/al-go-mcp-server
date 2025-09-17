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

### From npm (Recommended)

```bash
# Install globally for command line usage
npm install -g al-go-mcp-server

# Or use directly with npx (no installation required)
npx al-go-mcp-server
```

### From Source

```bash
git clone https://github.com/louagej/al-go-mcp-server.git
cd al-go-mcp-server
npm install
npm run build
npm start
```

## Usage

### Command Line

```bash
# If installed globally
al-go-mcp-server

# Or using npx (no installation needed)
npx al-go-mcp-server
```

### VS Code with MCP Extension

Add to your VS Code MCP settings (`.vscode/mcp.json`):

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio", 
      "command": "npx",
      "args": ["al-go-mcp-server"]
    }
  }
}
```

### With GitHub Authentication (Optional)

For higher rate limits and better performance, provide a GitHub token:

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio",
      "command": "npx", 
      "args": ["al-go-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Available Tools

When connected, the server provides these tools:

- **`search-al-go-docs`**: Search through AL-Go documentation with queries
- **`get-al-go-workflows`**: Get examples of AL-Go GitHub workflows  
- **`refresh-al-go-cache`**: Refresh cached documentation (force update)

## Development

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - see [LICENSE](LICENSE) file for details.

---

**Links:**
- [AL-Go Repository](https://github.com/microsoft/AL-Go)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Business Central AL Development](https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)