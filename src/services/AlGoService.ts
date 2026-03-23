import { Octokit } from "@octokit/rest";

/**
 * Service for interacting with the AL-Go GitHub repository
 */
/**
 * Scenario interface
 */
export interface Scenario {
  name: string;
  path: string;
  content: string;
  description: string;
}

/**
 * Issue interface
 */
export interface Issue {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
  comments: number;
}

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
   * Get the Octokit instance (for use by other services)
   */
  getOctokit(): Octokit {
    return this.octokit;
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

  /**
   * Get scenario files from the Scenarios directory
   */
  async getScenarios(): Promise<Scenario[]> {
    try {
      const scenarios: Scenario[] = [];

      // Get scenarios from Scenarios directory
      const { data: scenariosDir } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: "Scenarios"
      });

      if (Array.isArray(scenariosDir)) {
        const mdFiles = scenariosDir.filter(file =>
          file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.MD'))
        );

        for (const file of mdFiles) {
          try {
            const content = await this.getDocumentContent(file.path);

            // Extract title from first heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : file.name;

            // Extract description from first paragraph
            const descriptionMatch = content.match(/^[^#](.+?)(?:\n\n|$)/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "AL-Go scenario";

            scenarios.push({
              name: file.name,
              path: file.path,
              content: content,
              description: description
            });
          } catch (error) {
            console.error(`Failed to fetch scenario ${file.path}:`, error);
            // Continue with other scenarios
          }
        }
      }

      return scenarios;
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      throw new Error(`Failed to fetch scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workshop files from the Workshop directory
   */
  async getWorkshopFiles(): Promise<Scenario[]> {
    try {
      const workshops: Scenario[] = [];

      // Get workshops from Workshop directory
      const { data: workshopDir } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: "Workshop"
      });

      if (Array.isArray(workshopDir)) {
        const mdFiles = workshopDir.filter(file =>
          file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.MD'))
        );

        for (const file of mdFiles) {
          try {
            const content = await this.getDocumentContent(file.path);

            // Extract title from first heading
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : file.name;

            // Extract description from first paragraph
            const descriptionMatch = content.match(/^[^#](.+?)(?:\n\n|$)/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "AL-Go workshop material";

            workshops.push({
              name: file.name,
              path: file.path,
              content: content,
              description: description
            });
          } catch (error) {
            console.error(`Failed to fetch workshop ${file.path}:`, error);
            // Continue with other workshops
          }
        }
      }

      return workshops;
    } catch (error) {
      console.error("Error fetching workshop files:", error);
      throw new Error(`Failed to fetch workshop files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get resolved issues (tips and tricks)
   */
  async getResolvedIssues(limit: number = 20): Promise<Issue[]> {
    try {
      const issues: Issue[] = [];

      const { data: issuesList } = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'closed',
        per_page: limit,
        sort: 'updated',
        direction: 'desc'
      });

      issues.push(...issuesList.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        state: issue.state,
        labels: issue.labels.map(l => typeof l === 'string' ? l : l.name || ""),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        url: issue.html_url,
        comments: issue.comments
      })));

      return issues;
    } catch (error) {
      console.error("Error fetching issues:", error);
      throw new Error(`Failed to fetch issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search issues by keyword
   */
  async searchIssues(searchTerm: string, limit: number = 10): Promise<Issue[]> {
    try {
      const issues = await this.getResolvedIssues(50);

      const lowerTerm = searchTerm.toLowerCase();
      return issues
        .filter(i =>
          i.title.toLowerCase().includes(lowerTerm) ||
          i.body.toLowerCase().includes(lowerTerm) ||
          i.labels.some(l => l.toLowerCase().includes(lowerTerm))
        )
        .slice(0, limit);
    } catch (error) {
      console.error("Error searching issues:", error);
      throw new Error(`Failed to search issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get issues by label
   */
  async getIssuesByLabel(label: string): Promise<Issue[]> {
    try {
      const { data: issuesList } = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'closed',
        labels: label,
        per_page: 20,
        sort: 'updated'
      });

      return issuesList.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || "",
        state: issue.state,
        labels: issue.labels.map(l => typeof l === 'string' ? l : l.name || ""),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        url: issue.html_url,
        comments: issue.comments
      }));
    } catch (error) {
      console.error("Error fetching issues by label:", error);
      throw new Error(`Failed to fetch issues by label: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}