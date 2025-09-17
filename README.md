# AL-Go MCP Server

A Model Context Protocol (MCP) server for accessing AL-Go documentation and workflows from the `microsoft/AL-Go` repository.

## Features
- Search and access AL-Go documentation and workflows
- Works with public GitHub API (no token required for public repos)
- Optional: Use a GitHub token for higher rate limits
- Can be run via `npx` and configured in `.vscode/mcp.json`

## Usage

### 1. As a local or global npm package

```
npx al-go-mcp-server
```

### 2. In `.vscode/mcp.json`

```json
{
  "servers": {
    "al-go-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["al-go-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your_token_here" // Optional
      }
    }
  }
}
```

## Development

- Clone the repo
- Run `npm install`
- Run `npm run build`
- Run `npm start` or `npx tsx src/index.ts`

## License
MIT