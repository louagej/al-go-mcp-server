import { Octokit } from "@octokit/rest";
import { CacheManager } from "./CacheManager.js";
import { Bm25Index } from "./TextSearch.js";

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

export interface DocFile {
  path: string;
  content: string;
  name: string;
}

export class AlGoService {
  private octokit: Octokit;
  private authenticated = false;
  private owner = "microsoft";
  private repo = "AL-Go";

  constructor(private readonly cache: CacheManager = new CacheManager()) {
    // Initialize Octokit with authentication
    const githubToken = process.env.GITHUB_TOKEN || process.env.AL_GO_MCP_GITHUB_TOKEN;
    const githubAppId = process.env.GITHUB_APP_ID;
    const githubPrivateKey = process.env.GITHUB_PRIVATE_KEY;
    const githubInstallationId = process.env.GITHUB_INSTALLATION_ID;
    const userAgent = "al-go-mcp-server/1.0.0";

    this.authenticated = Boolean(githubToken || (githubAppId && githubPrivateKey && githubInstallationId));

    if (githubAppId && githubPrivateKey && githubInstallationId) {
      // Use GitHub App authentication
      this.octokit = new Octokit({
        appId: githubAppId,
        privateKey: githubPrivateKey.replace(/\\n/g, '\n'),
        installationId: githubInstallationId,
        userAgent
      });
      console.error("AL-Go MCP Server: Using GitHub App authentication");
    } else if (githubToken) {
      // Fallback to personal token
      this.octokit = new Octokit({
        auth: githubToken,
        userAgent
      });
      console.error("AL-Go MCP Server: Using personal token authentication");
    } else {
      // No authentication
      this.octokit = new Octokit({
        userAgent
      });
      console.error("AL-Go MCP Server: Using unauthenticated requests (rate limited)");
    }
  }

  /**
   * Get the Octokit instance (for use by other services)
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Whether GitHub credentials were configured (some APIs, like GraphQL, require them)
   */
  isAuthenticated(): boolean {
    return this.authenticated;
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
   * Get raw file content from raw.githubusercontent.com (not subject to the REST API rate limit)
   */
  private async getRawContent(path: string): Promise<string> {
    const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${encodeURI(path)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${path}`);
    }
    return response.text();
  }

  /**
   * Get all documentation files from the repository
   */
  async getDocumentationFiles(): Promise<DocFile[]> {
    return this.cache.getOrLoad('docs', 'all', () => this.fetchDocumentationFiles());
  }

  private async fetchDocumentationFiles(): Promise<DocFile[]> {
    try {
      const docs: DocFile[] = [];
      
      // Get repository tree to find documentation files
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: "main",
        recursive: "true"
      });

      // Markdown documentation only; skip repo housekeeping files
      const excluded = ['CODE_OF_CONDUCT.md', 'SECURITY.md', 'SUPPORT.md'];
      const docPaths = tree.tree
        .filter(item => item.type === 'blob' && item.path?.endsWith('.md'))
        .map(item => item.path as string)
        .filter(p => !p.startsWith('.github/') && !excluded.includes(p))
        .slice(0, 200);

      // Fetch raw content in small parallel batches. raw.githubusercontent.com
      // does not count against the REST API rate limit (60/hour unauthenticated).
      const batchSize = 8;
      for (let i = 0; i < docPaths.length; i += batchSize) {
        const batch = docPaths.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async filePath => {
          try {
            return { path: filePath, content: await this.getRawContent(filePath), name: filePath.split('/').pop() || filePath };
          } catch (error) {
            console.error(`Failed to fetch ${filePath}:`, error);
            return undefined;
          }
        }));
        for (const doc of results) {
          if (doc) docs.push(doc);
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
   * Get scenario guides (Scenarios/*.md) from the cached documentation set
   */
  async getScenarios(): Promise<Scenario[]> {
    return this.getDocsInFolder('Scenarios/', 'AL-Go scenario');
  }

  /**
   * Get workshop material (Workshop/*.md) from the cached documentation set
   */
  async getWorkshopFiles(): Promise<Scenario[]> {
    return this.getDocsInFolder('Workshop/', 'AL-Go workshop material');
  }

  private async getDocsInFolder(folder: string, fallbackDescription: string): Promise<Scenario[]> {
    const docs = await this.getDocumentationFiles();
    return docs
      .filter(doc => doc.path.startsWith(folder))
      .map(doc => {
        // First paragraph that isn't a heading, image or HTML
        const descriptionMatch = doc.content.match(/^(?![#!<\s])(.+?)(?:\n\n|$)/m);
        return {
          name: doc.name,
          path: doc.path,
          content: doc.content,
          description: descriptionMatch ? descriptionMatch[1].trim() : fallbackDescription
        };
      });
  }

  /**
   * Get the most recently updated closed issues (cached)
   */
  async getResolvedIssues(limit: number = 20): Promise<Issue[]> {
    const issues = await this.cache.getOrLoad('issue', 'closed', () => this.fetchClosedIssues());
    return issues.slice(0, limit);
  }

  private async fetchClosedIssues(): Promise<Issue[]> {
    try {
      const { data: issuesList } = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'closed',
        per_page: 100,
        sort: 'updated',
        direction: 'desc'
      });

      return issuesList
        .filter(issue => !issue.pull_request)
        .map(issue => ({
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
      console.error("Error fetching issues:", error);
      throw new Error(`Failed to fetch issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rank recently closed issues against a query
   */
  async searchIssues(searchTerm: string, limit: number = 10): Promise<Issue[]> {
    const issues = await this.getResolvedIssues(100);
    const index = new Bm25Index<Issue>();
    for (const issue of issues) {
      index.add(issue, [
        { text: issue.title, weight: 3 },
        { text: issue.labels.join(' '), weight: 2 },
        { text: issue.body, weight: 1 }
      ]);
    }
    return index.search(searchTerm, limit).map(r => r.item);
  }
}
