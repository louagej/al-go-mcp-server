import { Octokit } from "@octokit/rest";

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
  private cache: Map<string, { data: Discussion[]; timestamp: number }> = new Map();
  private cacheMaxAge = 6 * 60 * 60 * 1000; // 6 hours

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  /**
   * Fetch discussions from AL-Go repository
   */
  async fetchDiscussions(limit: number = 20): Promise<Discussion[]> {
    const cacheKey = `discussions-${limit}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data;
    }

    try {
      const query = `
        query {
          repository(owner: "${this.owner}", name: "${this.repo}") {
            discussions(first: ${limit}, orderBy: {field: UPDATED_AT, direction: DESC}) {
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

      // Cache the results
      this.cache.set(cacheKey, {
        data: discussions,
        timestamp: Date.now()
      });

      return discussions;
    } catch (error) {
      console.error("Error fetching discussions:", error);
      throw new Error(`Failed to fetch AL-Go discussions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search discussions by keyword
   */
  async searchDiscussions(searchTerm: string, limit: number = 10): Promise<Discussion[]> {
    try {
      const discussions = await this.fetchDiscussions(50);

      const lowerTerm = searchTerm.toLowerCase();
      return discussions
        .filter(d =>
          d.title.toLowerCase().includes(lowerTerm) ||
          d.body.toLowerCase().includes(lowerTerm) ||
          d.comments.some(c => c.body.toLowerCase().includes(lowerTerm))
        )
        .slice(0, limit);
    } catch (error) {
      console.error("Error searching discussions:", error);
      throw new Error(`Failed to search discussions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get discussions by category
   */
  async getDiscussionsByCategory(category: string): Promise<Discussion[]> {
    try {
      const discussions = await this.fetchDiscussions(50);
      return discussions.filter(d => d.category.toLowerCase() === category.toLowerCase());
    } catch (error) {
      console.error("Error filtering discussions by category:", error);
      throw new Error(`Failed to filter discussions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear discussion cache
   */
  clearCache(): void {
    this.cache.clear();
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
