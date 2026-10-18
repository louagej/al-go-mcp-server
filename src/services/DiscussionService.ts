import { Octokit } from "@octokit/rest";
import { CacheManager } from "./CacheManager.js";
import { Bm25Index } from "./TextSearch.js";

/**
 * Discussion interface
 */
export interface Discussion {
  number: number;
  title: string;
  body: string;
  category: string;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  comments: DiscussionComment[];
}

/**
 * Discussion comment interface
 */
export interface DiscussionComment {
  body: string;
  createdAt: string;
  author: string;
}

/**
 * Service for accessing GitHub Discussions via GraphQL API
 */
export class DiscussionService {
  private octokit: Octokit;
  private owner = "microsoft";
  private repo = "AL-Go";
  private static readonly FETCH_COUNT = 50;
  private static readonly TOKEN_REQUIRED = "Reading GitHub Discussions requires a valid GitHub token. Set GITHUB_TOKEN (or AL_GO_MCP_GITHUB_TOKEN) in the MCP server configuration.";

  constructor(
    octokit: Octokit,
    private readonly cache: CacheManager = new CacheManager(),
    private readonly authenticated = true
  ) {
    this.octokit = octokit;
  }

  /**
   * Get the most recently updated discussions (cached)
   */
  async fetchDiscussions(limit: number = 20): Promise<Discussion[]> {
    const discussions = await this.cache.getOrLoad('discussion', 'recent', () => this.loadDiscussions());
    return discussions.slice(0, limit);
  }

  private async loadDiscussions(): Promise<Discussion[]> {
    // The GraphQL API rejects all unauthenticated requests
    if (!this.authenticated) {
      throw new Error(DiscussionService.TOKEN_REQUIRED);
    }

    try {
      const query = `
        query {
          repository(owner: "${this.owner}", name: "${this.repo}") {
            discussions(first: ${DiscussionService.FETCH_COUNT}, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                number
                title
                body
                category {
                  name
                }
                upvoteCount
                createdAt
                updatedAt
                url
                comments(first: 3) {
                  nodes {
                    body
                    createdAt
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result: any = await this.octokit.graphql(query);

      const discussions: Discussion[] = result.repository.discussions.nodes.map((node: any) => ({
        number: node.number,
        title: node.title,
        body: node.body,
        category: node.category?.name || "General",
        upvoteCount: node.upvoteCount,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        url: node.url,
        comments: node.comments.nodes.map((comment: any) => ({
          body: comment.body,
          createdAt: comment.createdAt,
          author: comment.author?.login || "Unknown"
        }))
      }));

      return discussions;
    } catch (error) {
      console.error("Error fetching discussions:", error);
      if ((error as { status?: number }).status === 401) {
        throw new Error(DiscussionService.TOKEN_REQUIRED);
      }
      throw new Error(`Failed to fetch AL-Go discussions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rank recent discussions against a query
   */
  async searchDiscussions(searchTerm: string, limit: number = 10): Promise<Discussion[]> {
    const discussions = await this.fetchDiscussions(DiscussionService.FETCH_COUNT);
    const index = new Bm25Index<Discussion>();
    for (const d of discussions) {
      index.add(d, [
        { text: d.title, weight: 3 },
        { text: d.body, weight: 1 },
        { text: d.comments.map(c => c.body).join(' '), weight: 1 }
      ]);
    }
    return index.search(searchTerm, limit).map(r => r.item);
  }

  /**
   * Format discussion for display
   */
  formatDiscussion(discussion: Discussion): string {
    const commentsText = discussion.comments.length > 0
      ? `\n\n**Recent Comments:**\n${discussion.comments.map(c => `- ${c.author}: ${c.body.substring(0, 100)}...`).join('\n')}`
      : '';

    return `
**${discussion.title}** (#${discussion.number})
Category: ${discussion.category}
Upvotes: ${discussion.upvoteCount}
Updated: ${new Date(discussion.updatedAt).toLocaleDateString()}

${discussion.body.substring(0, 500)}...

[View Discussion](${discussion.url})${commentsText}
    `.trim();
  }
}
