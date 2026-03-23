#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AlGoService } from "./services/AlGoService.js";
import { DocumentIndex } from "./services/DocumentIndex.js";
import { SpecialistService } from "./services/SpecialistService.js";
import { DiscussionService } from "./services/DiscussionService.js";
import { KnowledgeGraphService } from "./services/KnowledgeGraphService.js";
import { CacheManager } from "./services/CacheManager.js";
import { SemanticSearchService } from "./services/SemanticSearchService.js";
import { KnowledgeGraphAPI } from "./services/KnowledgeGraphAPI.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  try {
    const { packageJson } = getPackageVersion();
    console.log(`al-go-mcp-server v${packageJson.version}`);
    process.exit(0);
  } catch (error) {
    console.log('al-go-mcp-server (version unknown)');
    process.exit(0);
  }
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AL-Go MCP Server

A Model Context Protocol server for accessing AL-Go documentation.

Usage:
  npx al-go-mcp-server              Start the MCP server
  npx al-go-mcp-server --version    Show version information
  npx al-go-mcp-server --help       Show this help message

Environment Variables:
  GITHUB_TOKEN                      Optional GitHub token for higher rate limits

For more information, visit: https://github.com/louagej/al-go-mcp-server
`);
  process.exit(0);
}

/**
 * AL-Go Documentation MCP Server
 * 
 * This server provides access to AL-Go documentation through MCP protocol.
 * It fetches documentation from the microsoft/AL-Go repository and provides
 * search capabilities for AL-Go specific queries.
 */

// Function to get version from package.json
function getPackageVersion(): { version: string; packageJson: any } {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return { version: packageJson.version, packageJson };
}

// Main function to start the server
async function main() {
  console.error("Starting AL-Go MCP Server...");
  
  try {
    // Get package info
    const { packageJson } = getPackageVersion();

    // Initialize the MCP server
    const server = new McpServer({
      name: "al-go-mcp-server",
      version: packageJson.version
    });

    // Initialize services lazily to avoid startup messages for --version/--help
    let alGoService: AlGoService;
    let documentIndex: DocumentIndex;
    let specialistService: SpecialistService;
    let discussionService: DiscussionService;
    let knowledgeGraphService: KnowledgeGraphService;
    let cacheManager: CacheManager;
    let semanticSearchService: SemanticSearchService;
    let knowledgeGraphAPI: KnowledgeGraphAPI;

    function getAlGoService(): AlGoService {
      if (!alGoService) {
        alGoService = new AlGoService();
      }
      return alGoService;
    }

    function getDocumentIndex(): DocumentIndex {
      if (!documentIndex) {
        documentIndex = new DocumentIndex();
      }
      return documentIndex;
    }

    function getSpecialistService(): SpecialistService {
      if (!specialistService) {
        specialistService = new SpecialistService();
      }
      return specialistService;
    }

    function getDiscussionService(): DiscussionService {
      if (!discussionService) {
        discussionService = new DiscussionService(getAlGoService().getOctokit());
      }
      return discussionService;
    }

    function getKnowledgeGraphService(): KnowledgeGraphService {
      if (!knowledgeGraphService) {
        knowledgeGraphService = new KnowledgeGraphService();
      }
      return knowledgeGraphService;
    }

    function getCacheManager(): CacheManager {
      if (!cacheManager) {
        cacheManager = new CacheManager();
      }
      return cacheManager;
    }

    function getSemanticSearchService(): SemanticSearchService {
      if (!semanticSearchService) {
        semanticSearchService = new SemanticSearchService();
      }
      return semanticSearchService;
    }

    function getKnowledgeGraphAPI(): KnowledgeGraphAPI {
      if (!knowledgeGraphAPI) {
        knowledgeGraphAPI = new KnowledgeGraphAPI();
      }
      return knowledgeGraphAPI;
    }

// Resource: Get server version information
server.registerResource(
  "server-version",
  "al-go://server/version",
  {
    title: "AL-Go MCP Server Version",
    description: "Version information for the AL-Go MCP server",
    mimeType: "application/json"
  },
  async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          author: packageJson.author
        }, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

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
    const repoInfo = await getAlGoService().getRepositoryInfo();
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
    const content = await getAlGoService().getDocumentContent(urlPath);
    return {
      contents: [{
        uri: uri.href,
        text: content,
        mimeType: "text/markdown"
      }]
    };
  }
);

// Resource: List all specialists
server.registerResource(
  "specialists-list",
  "al-go://specialists/list",
  {
    title: "AL-Go Specialists List",
    description: "List of all available AL-Go specialists"
  },
  async (uri) => {
    const specialists = getSpecialistService().getAll();
    const specialistsJson = JSON.stringify(specialists, null, 2);
    return {
      contents: [{
        uri: uri.href,
        text: specialistsJson,
        mimeType: "application/json"
      }]
    };
  }
);

// Resource: Get specific specialist
server.registerResource(
  "specialist-detail",
  "al-go://specialists/{id}",
  {
    title: "AL-Go Specialist Details",
    description: "Get details about a specific AL-Go specialist"
  },
  async (uri) => {
    const specialistId = new URL(uri.href).pathname.split('/').pop();
    if (!specialistId) {
      throw new Error("Specialist ID required");
    }

    const specialist = getSpecialistService().getById(specialistId);
    if (!specialist) {
      throw new Error(`Specialist not found: ${specialistId}`);
    }

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(specialist, null, 2),
        mimeType: "application/json"
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
      const results = await getDocumentIndex().search(query, limit);
      
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
      const workflows = await getAlGoService().getWorkflowExamples(workflowType);
      
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

// Tool: Get server version
server.registerTool(
  "get-server-version",
  {
    title: "Get AL-Go MCP Server Version",
    description: "Get version information for the AL-Go MCP server",
    inputSchema: {}
  },
  async () => {
    return {
      content: [{
        type: "text",
        text: `AL-Go MCP Server v${packageJson.version}\n\nAuthor: ${packageJson.author}\nDescription: ${packageJson.description}\nRepository: ${packageJson.repository?.url || 'N/A'}`
      }]
    };
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
      await getDocumentIndex().refresh(getAlGoService(), force);
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

// Tool: Search specialists
server.registerTool(
  "alg-search-specialists",
  {
    title: "Search AL-Go Specialists",
    description: "Search for AL-Go specialists by name, expertise, or keyword",
    inputSchema: {
      query: z.string().describe("Search query (specialist name, expertise, or keyword)")
    }
  },
  async ({ query }) => {
    try {
      const results = getSpecialistService().search(query);

      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No specialists found matching "${query}".`
          }]
        };
      }

      const resultText = getSpecialistService().formatSpecialists(results);

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} specialist(s) for "${query}":\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching specialists: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: List all specialists
server.registerTool(
  "alg-list-specialists",
  {
    title: "List All AL-Go Specialists",
    description: "List all available AL-Go specialists and their expertise areas",
    inputSchema: {}
  },
  async () => {
    try {
      const specialists = getSpecialistService().getAll();
      const resultText = specialists
        .map((s, idx) => `${idx + 1}. **${s.name}** (${s.id})\n   ${s.description}`)
        .join('\n\n');

      return {
        content: [{
          type: "text",
          text: `Available AL-Go Specialists (${specialists.length} total):\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing specialists: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get specialist details
server.registerTool(
  "alg-get-specialist",
  {
    title: "Get AL-Go Specialist Details",
    description: "Get detailed information about a specific AL-Go specialist",
    inputSchema: {
      specialistId: z.string().describe("The ID of the specialist (e.g., 'cicd-architect', 'app-generator')")
    }
  },
  async ({ specialistId }) => {
    try {
      const specialist = getSpecialistService().getById(specialistId);

      if (!specialist) {
        return {
          content: [{
            type: "text",
            text: `Specialist not found: ${specialistId}. Use 'alg-list-specialists' to see available specialists.`
          }],
          isError: true
        };
      }

      const formattedSpecialist = getSpecialistService().formatSpecialist(specialist);
      const relatedSpecialists = getSpecialistService().getRelated(specialistId);
      const relatedText = relatedSpecialists.length > 0
        ? `\n\n**Related Specialists:**\n${relatedSpecialists.map(s => `- ${s.name}`).join('\n')}`
        : '';

      return {
        content: [{
          type: "text",
          text: `${formattedSpecialist}${relatedText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving specialist details: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Search discussions
server.registerTool(
  "alg-search-discussions",
  {
    title: "Search AL-Go GitHub Discussions",
    description: "Search for relevant discussions in the AL-Go repository",
    inputSchema: {
      query: z.string().describe("Search query for discussions"),
      limit: z.number().default(10).describe("Maximum number of results to return")
    }
  },
  async ({ query, limit }) => {
    try {
      const results = await getDiscussionService().searchDiscussions(query, limit);

      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No discussions found matching "${query}".`
          }]
        };
      }

      const resultText = results
        .map((d, idx) => getDiscussionService().formatDiscussion(d))
        .join('\n\n---\n\n');

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} discussion(s) for "${query}":\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching discussions: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get scenarios
server.registerTool(
  "alg-get-scenarios",
  {
    title: "Get AL-Go Scenarios",
    description: "Get available AL-Go setup scenarios",
    inputSchema: {}
  },
  async () => {
    try {
      const scenarios = await getAlGoService().getScenarios();

      if (scenarios.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No scenarios found."
          }]
        };
      }

      const resultText = scenarios
        .map((s, idx) => `${idx + 1}. **${s.name}**\n   ${s.description}`)
        .join('\n\n');

      return {
        content: [{
          type: "text",
          text: `Available AL-Go Scenarios (${scenarios.length} total):\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Search resolved issues
server.registerTool(
  "alg-search-issues",
  {
    title: "Search AL-Go Resolved Issues",
    description: "Search for tips and tricks in resolved AL-Go issues",
    inputSchema: {
      query: z.string().describe("Search query for issues"),
      limit: z.number().default(10).describe("Maximum number of results to return")
    }
  },
  async ({ query, limit }) => {
    try {
      const results = await getAlGoService().searchIssues(query, limit);

      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No issues found matching "${query}".`
          }]
        };
      }

      const resultText = results
        .map((i, idx) => `${idx + 1}. **${i.title}** (#${i.number})\n   Status: ${i.state}\n   Comments: ${i.comments}\n   [View Issue](${i.url})`)
        .join('\n\n');

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} issue(s) matching "${query}":\n\n${resultText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching issues: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get specialist knowledge
server.registerTool(
  "alg-get-specialist-knowledge",
  {
    title: "Get Specialist Knowledge",
    description: "Get comprehensive knowledge for a specialist including workshops, scenarios, discussions, and issues",
    inputSchema: {
      specialistId: z.string().describe("The ID of the specialist")
    }
  },
  async ({ specialistId }) => {
    try {
      const knowledge = getKnowledgeGraphService().getSpecialistKnowledge(specialistId);

      if (!knowledge) {
        return {
          content: [{
            type: "text",
            text: `Specialist not found: ${specialistId}`
          }],
          isError: true
        };
      }

      const formattedKnowledge = getKnowledgeGraphService().formatSpecialistKnowledge(specialistId);

      return {
        content: [{
          type: "text",
          text: formattedKnowledge
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving specialist knowledge: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Build knowledge graph
server.registerTool(
  "alg-build-knowledge-graph",
  {
    title: "Build Knowledge Graph",
    description: "Initialize and build the knowledge graph linking specialists to all knowledge sources",
    inputSchema: {}
  },
  async () => {
    try {
      console.error("Building knowledge graph...");

      const specialists = getSpecialistService().getAll();
      const workshops = await getAlGoService().getWorkshopFiles();
      const scenarios = await getAlGoService().getScenarios();
      const discussions = await getDiscussionService().fetchDiscussions(20);
      const issues = await getAlGoService().getResolvedIssues(20);

      await getKnowledgeGraphService().buildKnowledgeGraph(
        specialists,
        workshops,
        scenarios,
        discussions,
        issues
      );

      const stats = getKnowledgeGraphService().getStats();
      const statsText = Object.entries(stats.specialistStats)
        .slice(0, 5)
        .map(([id, stat]) => `- ${id}: ${stat.workshops + stat.scenarios + stat.discussions + stat.issues} items`)
        .join('\n');

      return {
        content: [{
          type: "text",
          text: `Knowledge graph built successfully!\n\nTotal Specialists: ${stats.totalSpecialists}\n\nTop Specialists:\n${statsText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error building knowledge graph: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// === PHASE 3: Advanced Features ===

// Tool: Semantic search across all knowledge sources
server.registerTool(
  "alg-semantic-search",
  {
    title: "Semantic Search",
    description: "Intelligent cross-source search across workshops, scenarios, discussions, and issues using relevance scoring",
    inputSchema: {
      query: z.string().describe("Search query"),
      limit: z.number().default(10).describe("Maximum results to return")
    }
  },
  async ({ query, limit }) => {
    try {
      const semanticSearch = getSemanticSearchService();

      // Fetch knowledge from all sources (in production, would use cache)
      const workshops = await getAlGoService().getWorkshopFiles();
      const scenarios = await getAlGoService().getScenarios();
      const discussions = await getDiscussionService().fetchDiscussions(20);
      const issues = await getAlGoService().getResolvedIssues(20);

      const results = semanticSearch.search(
        query,
        { workshops, scenarios, discussions, issues },
        limit
      );

      const resultText = semanticSearch.formatResults(results);

      return {
        content: [{
          type: "text",
          text: resultText
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error performing semantic search: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get knowledge graph visualization
server.registerTool(
  "alg-graph-visualization",
  {
    title: "Knowledge Graph Visualization",
    description: "Get knowledge graph structure for visualization (nodes and edges)",
    inputSchema: {
      format: z.enum(["json", "stats"]).default("json").describe("Output format")
    }
  },
  async ({ format }) => {
    try {
      const specialists = getSpecialistService().getAll();
      const knowledgeGraphService = getKnowledgeGraphService();
      const graphAPI = getKnowledgeGraphAPI();

      // For now, create a simple graph with specialist nodes
      // In production, would use built knowledge graph
      const nodes = specialists.map(s => ({
        id: s.id,
        type: 'specialist' as const,
        label: s.name,
        metadata: { description: s.description }
      }));

      // Create edges between related specialists
      const edges: any[] = [];
      for (let i = 0; i < specialists.length; i++) {
        const related = getSpecialistService().getRelated(specialists[i].id);
        for (const rel of related) {
          edges.push({
            from: specialists[i].id,
            to: rel.id,
            type: 'relates-to',
            weight: 0.7
          });
        }
      }

      const graph = {
        nodes,
        edges,
        metadata: {
          totalSpecialists: specialists.length,
          totalKnowledge: 0,
          averageConnections: edges.length / specialists.length
        }
      };

      if (format === 'json') {
        return {
          content: [{
            type: "text",
            text: JSON.stringify(graphAPI.formatForVisualization(graph), null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: graphAPI.formatStats(graph)
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating graph visualization: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Get cache statistics
server.registerTool(
  "alg-cache-stats",
  {
    title: "Cache Statistics",
    description: "Get cache hit rates and statistics for knowledge sources",
    inputSchema: {}
  },
  async () => {
    try {
      const cache = getCacheManager();
      const stats = cache.formatStats();

      return {
        content: [{
          type: "text",
          text: `**Cache Performance**\n\n${stats}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving cache statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Tool: Clear cache selectively
server.registerTool(
  "alg-clear-cache",
  {
    title: "Clear Cache",
    description: "Clear cached knowledge sources or entire cache",
    inputSchema: {
      source: z.enum(["workshop", "scenario", "discussion", "issue", "all"]).default("all").describe("Cache source to clear")
    }
  },
  async ({ source }) => {
    try {
      const cache = getCacheManager();

      let message = '';
      if (source === 'all') {
        cache.clearAll();
        message = 'All cache cleared successfully';
      } else {
        const count = cache.clearSource(source);
        message = `Cleared ${count} item(s) from ${source} cache`;
      }

      return {
        content: [{
          type: "text",
          text: `✓ ${message}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error clearing cache: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    // Start the server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error(`AL-Go MCP Server v${packageJson.version} is running on stdio`);
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