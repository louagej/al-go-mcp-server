#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AlGoService } from "./services/AlGoService.js";
import { DocumentIndex } from "./services/DocumentIndex.js";

/**
 * AL-Go Documentation MCP Server
 * 
 * This server provides access to AL-Go documentation through MCP protocol.
 * It fetches documentation from the microsoft/AL-Go repository and provides
 * search capabilities for AL-Go specific queries.
 */

// Initialize the MCP server
const server = new McpServer({
  name: "al-go-mcp-server",
  version: "1.0.0"
});

// Initialize services
const alGoService = new AlGoService();
const documentIndex = new DocumentIndex();

// Resource: Get AL-Go repository information
server.registerResource(
  "al-go-repo-info",
  "al-go://repo/info",
  {
    title: "AL-Go Repository Information",
    description: "Basic information about the AL-Go repository",
    mimeType: "application/json"
  },
  async (uri) => {
    const repoInfo = await alGoService.getRepositoryInfo();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(repoInfo, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// Resource: Get specific AL-Go documentation file
server.registerResource(
  "al-go-doc",
  "al-go://docs/{path}",
  {
    title: "AL-Go Documentation File",
    description: "Get content from a specific AL-Go documentation file"
  },
  async (uri) => {
    // Extract path from URI
    const urlPath = new URL(uri.href).pathname.replace('/docs/', '');
    const content = await alGoService.getDocumentContent(urlPath);
    return {
      contents: [{
        uri: uri.href,
        text: content,
        mimeType: "text/markdown"
      }]
    };
  }
);

// Tool: Search AL-Go documentation
server.registerTool(
  "search-al-go-docs",
  {
    title: "Search AL-Go Documentation",
    description: "Search through AL-Go documentation for specific queries",
    inputSchema: {
      query: z.string().describe("Search query for AL-Go documentation"),
      limit: z.number().default(10).describe("Maximum number of results to return")
    }
  },
  async ({ query, limit }) => {
    try {
      // Use direct API search instead of indexing
      const results = await documentIndex.search(query, limit);
      
      const resultText = results.map((result: any, index: number) => 
        `${index + 1}. **${result.title}** (${result.path})\n   ${result.excerpt}\n   Score: ${result.score.toFixed(2)}\n`
      ).join('\n');
      
      return {
        content: [{
          type: "text",
          text: `Found ${results.length} results for "${query}":\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching AL-Go documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get AL-Go workflow examples
server.registerTool(
  "get-al-go-workflows",
  {
    title: "Get AL-Go Workflow Examples",
    description: "Get examples of AL-Go GitHub workflows",
    inputSchema: {
      workflowType: z.enum(["cicd", "deployment", "testing", "all"]).default("all").describe("Type of workflows to retrieve")
    }
  },
  async ({ workflowType }) => {
    try {
      const workflows = await alGoService.getWorkflowExamples(workflowType);
      
      const workflowText = workflows.map((workflow: any) => 
        `## ${workflow.name}\n**Path:** ${workflow.path}\n**Description:** ${workflow.description}\n\n\`\`\`yaml\n${workflow.content}\n\`\`\`\n`
      ).join('\n---\n\n');
      
      return {
        content: [{
          type: "text",
          text: `AL-Go Workflow Examples (${workflowType}):\n\n${workflowText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving AL-Go workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Refresh documentation cache
server.registerTool(
  "refresh-al-go-cache",
  {
    title: "Refresh AL-Go Documentation Cache",
    description: "Refresh the cached AL-Go documentation from the repository",
    inputSchema: {
      force: z.boolean().default(false).describe("Force refresh even if cache is recent")
    }
  },
  async ({ force }) => {
    try {
      await documentIndex.refresh(alGoService, force);
      return {
        content: [{
          type: "text",
          text: "AL-Go documentation cache refreshed successfully."
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error refreshing AL-Go cache: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Prompt: AL-Go project setup help
server.registerPrompt(
  "al-go-setup-help",
  {
    title: "AL-Go Project Setup Help",
    description: "Get help with setting up AL-Go for Business Central projects",
    argsSchema: {
      projectType: z.enum(["per-tenant-extension", "app-source", "template"]).describe("Type of AL-Go project"),
      scenario: z.string().optional().describe("Specific scenario or requirement")
    }
  },
  ({ projectType, scenario }) => {
    const basePrompt = `You are an expert in AL-Go for GitHub, Microsoft's development framework for Business Central extensions. Help the user set up an AL-Go project.

Project Type: ${projectType}
${scenario ? `Scenario: ${scenario}` : ''}

Please provide step-by-step guidance including:
1. Repository setup and structure
2. Required configuration files
3. Workflow configuration
4. Best practices and common pitfalls

Use the AL-Go documentation and examples available through the MCP tools to provide accurate, up-to-date information.`;

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: basePrompt
        }
      }]
    };
  }
);

// Main function to start the server
async function main() {
  console.error("Starting AL-Go MCP Server...");
  
  try {
    // Document index will be initialized on first search request
    
    // Start the server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("AL-Go MCP Server is running on stdio");
  } catch (error) {
    console.error("Failed to start AL-Go MCP Server:", error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.error("Shutting down AL-Go MCP Server...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error("Shutting down AL-Go MCP Server...");
  process.exit(0);
});

// Start the server
main().catch(error => {
  console.error("Fatal error in AL-Go MCP Server:", error);
  process.exit(1);
});