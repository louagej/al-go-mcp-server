import { Octokit } from "@octokit/rest";

/**
 * Service for interacting with the AL-Go GitHub repository
 */
export class AlGoService {
  private octokit: Octokit;
  private owner = "microsoft";
  private repo = "AL-Go";

  constructor() {
    // Initialize Octokit with authentication
    const githubToken = process.env.GITHUB_TOKEN || process.env.AL_GO_MCP_GITHUB_TOKEN;
    const githubAppId = process.env.GITHUB_APP_ID;
    const githubPrivateKey = process.env.GITHUB_PRIVATE_KEY;
    const githubInstallationId = process.env.GITHUB_INSTALLATION_ID;
    const userAgent = "al-go-mcp-server/1.0.0";

    if (githubAppId && githubPrivateKey && githubInstallationId) {
      // Use GitHub App authentication
      this.octokit = new Octokit({
        appId: githubAppId,
        privateKey: githubPrivateKey.replace(/\\n/g, '\n'),
        installationId: githubInstallationId,
        userAgent
      });
      console.log("AL-Go MCP Server: Using GitHub App authentication");
    } else if (githubToken) {
      // Fallback to personal token
      this.octokit = new Octokit({
        auth: githubToken,
        userAgent
      });
      console.log("AL-Go MCP Server: Using personal token authentication");
    } else {
      // No authentication
      this.octokit = new Octokit({
        userAgent
      });
      console.log("AL-Go MCP Server: Using unauthenticated requests (rate limited)");
    }
  }

  /**
   * Get basic repository information
   */
  async getRepositoryInfo() {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      });

      return {
        name: data.name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        lastUpdated: data.updated_at,
        defaultBranch: data.default_branch,
        url: data.html_url,
        topics: data.topics
      };
    } catch (error) {
      console.error("Error fetching repository info:", error);
      throw new Error(`Failed to fetch AL-Go repository information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get content of a specific documentation file
   */
  async getDocumentContent(path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path
      });

      if ('content' in data && data.content) {
        // Decode base64 content
        return Buffer.from(data.content, 'base64').toString('utf8');
      } else {
        throw new Error("File content not found or is a directory");
      }
    } catch (error) {
      console.error(`Error fetching document ${path}:`, error);
      throw new Error(`Failed to fetch document ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all documentation files from the repository
   */
  async getDocumentationFiles(): Promise<Array<{ path: string; content: string; name: string }>> {
    try {
      const docs: Array<{ path: string; content: string; name: string }> = [];
      
      // Get repository tree to find documentation files
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: "main",
        recursive: "true"
      });

      // Filter for documentation files (markdown, txt, and specific documentation directories)
      const docFiles = tree.tree.filter(item => 
        item.type === 'blob' && 
        item.path && (
          item.path.endsWith('.md') ||
          item.path.endsWith('.txt') ||
          item.path.includes('Actions/') ||
          item.path.includes('Scenarios/') ||
          item.path.includes('Workshop/') ||
          item.path.includes('Documentation/') ||
          item.path === 'README.md' ||
          item.path === 'RELEASENOTES.md'
        )
      );

      // Fetch content for each documentation file (limit to avoid API rate limits)
      const maxFiles = 50; // Reasonable limit for initial implementation
      for (let i = 0; i < Math.min(docFiles.length, maxFiles); i++) {
        const file = docFiles[i];
        if (file.path) {
          try {
            const content = await this.getDocumentContent(file.path);
            docs.push({
              path: file.path,
              content: content,
              name: file.path.split('/').pop() || file.path
            });
          } catch (error) {
            console.error(`Failed to fetch ${file.path}:`, error);
            // Continue with other files
          }
        }
      }

      return docs;
    } catch (error) {
      console.error("Error fetching documentation files:", error);
      throw new Error(`Failed to fetch documentation files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workflow examples from the repository
   */
  async getWorkflowExamples(workflowType: string): Promise<Array<{ name: string; path: string; content: string; description: string }>> {
    try {
      const workflows: Array<{ name: string; path: string; content: string; description: string }> = [];
      
      // Get workflows from .github/workflows directory
      const { data: workflowDir } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: ".github/workflows"
      });

      if (Array.isArray(workflowDir)) {
        const yamlFiles = workflowDir.filter(file => 
          file.type === 'file' && file.name.endsWith('.yml') || file.name.endsWith('.yaml')
        );

        for (const file of yamlFiles) {
          try {
            const content = await this.getDocumentContent(file.path);
            
            // Extract description from workflow file
            const descriptionMatch = content.match(/^#\s*(.+)$/m);
            const description = descriptionMatch ? descriptionMatch[1] : 'AL-Go workflow';

            // Filter by workflow type if specified
            if (workflowType === 'all' || this.matchesWorkflowType(file.name, content, workflowType)) {
              workflows.push({
                name: file.name,
                path: file.path,
                content: content,
                description: description
              });
            }
          } catch (error) {
            console.error(`Failed to fetch workflow ${file.path}:`, error);
            // Continue with other workflows
          }
        }
      }

      return workflows;
    } catch (error) {
      console.error("Error fetching workflow examples:", error);
      throw new Error(`Failed to fetch workflow examples: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a workflow matches the specified type
   */
  private matchesWorkflowType(fileName: string, content: string, workflowType: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    const lowerContent = content.toLowerCase();

    switch (workflowType) {
      case 'cicd':
        return lowerFileName.includes('cicd') || 
               lowerFileName.includes('ci') || 
               lowerContent.includes('continuous integration') ||
               lowerContent.includes('build and test');
      
      case 'deployment':
        return lowerFileName.includes('deploy') || 
               lowerFileName.includes('release') ||
               lowerContent.includes('deployment') ||
               lowerContent.includes('publish');
      
      case 'testing':
        return lowerFileName.includes('test') || 
               lowerContent.includes('test') ||
               lowerContent.includes('validation');
      
      default:
        return true;
    }
  }
}