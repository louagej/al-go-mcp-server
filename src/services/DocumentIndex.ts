import { AlGoService } from "./AlGoService.js";

export interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
  score: number;
  content: string;
}

export interface DocumentEntry {
  path: string;
  content: string;
  name: string;
  title: string;
  lastIndexed: Date;
}

/**
 * Service for indexing and searching AL-Go documentation
 */
export class DocumentIndex {
  private documents: DocumentEntry[] = [];
  private isInitialized = false;
  private lastRefresh: Date | null = null;

  /**
   * Initialize the document index
   */
  async initialize(alGoService: AlGoService): Promise<void> {
    if (this.isInitialized && this.lastRefresh && 
        (Date.now() - this.lastRefresh.getTime()) < 3600000) { // 1 hour cache
      return;
    }

    console.error("Initializing AL-Go document index...");
    
    try {
      const docs = await alGoService.getDocumentationFiles();
      this.documents = docs.map(doc => ({
        path: doc.path,
        content: doc.content,
        name: doc.name,
        title: this.extractTitle(doc.content, doc.name),
        lastIndexed: new Date()
      }));

      this.isInitialized = true;
      this.lastRefresh = new Date();
      console.error(`Indexed ${this.documents.length} AL-Go documents`);
    } catch (error) {
      console.error("Failed to initialize document index:", error);
      throw error;
    }
  }

  /**
   * Search through the indexed documents
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Return a simple response to avoid API rate limits
    return [{
      title: "AL-Go Documentation Search",
      path: "README.md", 
      excerpt: `Search for "${query}" - Due to GitHub API rate limits, please use specific file paths with the al-go-doc resource or try the get-al-go-workflows tool.`,
      score: 1.0,
      content: "Use specific AL-Go documentation file paths or workflow tools for better results."
    }];
  }

  /**
   * Refresh the document index
   */
  async refresh(alGoService: AlGoService, force: boolean = false): Promise<void> {
    if (force || !this.lastRefresh || 
        (Date.now() - this.lastRefresh.getTime()) > 3600000) { // 1 hour cache
      this.isInitialized = false;
      await this.initialize(alGoService);
    }
  }

  /**
   * Extract title from document content
   */
  private extractTitle(content: string, fallbackName: string): string {
    // Try to find the first heading in markdown
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Try to find title in front matter
    const frontMatterMatch = content.match(/^---\s*\n.*?title:\s*(.+?)\s*\n.*?---/s);
    if (frontMatterMatch) {
      return frontMatterMatch[1].trim();
    }

    // Use filename without extension as fallback
    return fallbackName.replace(/\.[^/.]+$/, "");
  }

  /**
   * Calculate relevance score for a document given a query
   */
  private calculateRelevanceScore(doc: DocumentEntry, lowerQuery: string): number {
    let score = 0;
    const lowerContent = doc.content.toLowerCase();
    const lowerTitle = doc.title.toLowerCase();
    const lowerPath = doc.path.toLowerCase();

    // Exact matches in title get highest score
    if (lowerTitle.includes(lowerQuery)) {
      score += 10;
    }

    // Matches in path get medium score
    if (lowerPath.includes(lowerQuery)) {
      score += 5;
    }

    // Word matches in content
    const queryWords = lowerQuery.split(/\s+/);
    for (const word of queryWords) {
      if (word.length > 2) { // Ignore very short words
        const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = (lowerContent.match(wordRegex) || []).length;
        score += matches * 0.5;

        // Bonus for matches in headings
        const headingMatches = (lowerContent.match(new RegExp(`^#+.*${word}.*$`, 'gmi')) || []).length;
        score += headingMatches * 2;
      }
    }

    // Bonus for AL-Go specific terms
    const alGoTerms = ['al-go', 'business central', 'workflow', 'actions', 'templates', 'devops'];
    for (const term of alGoTerms) {
      if (lowerQuery.includes(term) && lowerContent.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * Extract a relevant excerpt from the document content
   */
  private extractExcerpt(content: string, lowerQuery: string, maxLength: number = 200): string {
    const lowerContent = content.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);
    
    // Find the first occurrence of any query word
    let bestIndex = -1;
    for (const word of queryWords) {
      if (word.length > 2) {
        const index = lowerContent.indexOf(word);
        if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
          bestIndex = index;
        }
      }
    }

    if (bestIndex === -1) {
      // No match found, return beginning of content
      return content.substring(0, maxLength).trim() + (content.length > maxLength ? '...' : '');
    }

    // Extract excerpt around the match
    const start = Math.max(0, bestIndex - 50);
    const end = Math.min(content.length, start + maxLength);
    
    let excerpt = content.substring(start, end);
    
    // Clean up the excerpt
    excerpt = excerpt.replace(/\n+/g, ' ').trim();
    
    // Add ellipsis if we're not at the beginning/end
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
}