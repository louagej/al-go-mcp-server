/**
 * Semantic search result with relevance score
 */
export interface SemanticSearchResult {
  title: string;
  body: string;
  source: 'workshop' | 'scenario' | 'discussion' | 'issue';
  relevance: number; // 0-1 score
  specialist?: string;
  url?: string;
  metadata: {
    type?: string;
    category?: string;
    date?: string;
    itemNumber?: number; // for issues/discussions
  };
}

/**
 * Service for semantic search across all knowledge sources
 * Uses TF-IDF inspired relevance scoring with semantic similarity
 */
export class SemanticSearchService {
  // Common AL-Go stopwords to exclude
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'is', 'was', 'are', 'be', 'by', 'with', 'this', 'that', 'it',
    'al', 'go', 'al-go', 'github', 'repository', 'file', 'solution'
  ]);

  constructor() {}

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopwords.has(token));
  }

  /**
   * Calculate TF-IDF score
   */
  private calculateTFIDF(tokens: string[], documentTokens: string[]): number {
    const docSet = new Set(documentTokens);

    let score = 0;
    for (const token of tokens) {
      if (docSet.has(token)) {
        const tf = documentTokens.filter(t => t === token).length / documentTokens.length;
        const idf = Math.log(1 / (1 + documentTokens.filter(t => t === token).length));
        score += tf * idf;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculate semantic similarity using word overlap
   */
  private calculateSimilarity(queryTokens: string[], documentTokens: string[]): number {
    const querySet = new Set(queryTokens);
    const documentSet = new Set(documentTokens);

    // Jaccard similarity
    const intersection = [...querySet].filter(t => documentSet.has(t)).length;
    const union = new Set([...querySet, ...documentSet]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Search across knowledge sources
   */
  search(
    query: string,
    knowledgeSources: {
      workshops: any[];
      scenarios: any[];
      discussions: any[];
      issues: any[];
    },
    limit: number = 20
  ): SemanticSearchResult[] {
    const queryTokens = this.tokenize(query);
    const results: SemanticSearchResult[] = [];

    // Search workshops (highest weight - foundational knowledge)
    for (const workshop of knowledgeSources.workshops) {
      const docTokens = this.tokenize(`${workshop.name} ${workshop.description} ${workshop.content}`);
      const similarity = this.calculateSimilarity(queryTokens, docTokens);
      const tfidf = this.calculateTFIDF(queryTokens, docTokens);
      const relevance = (similarity * 0.6 + tfidf * 0.4) * 1.2; // 20% boost for workshops

      if (relevance > 0.1) {
        results.push({
          title: workshop.name,
          body: workshop.description || workshop.content?.substring(0, 200),
          source: 'workshop',
          relevance,
          url: `https://github.com/microsoft/AL-Go/blob/main/${workshop.path}`,
          metadata: {
            type: 'Foundational Knowledge'
          }
        });
      }
    }

    // Search scenarios (high weight - setup guides)
    for (const scenario of knowledgeSources.scenarios) {
      const docTokens = this.tokenize(`${scenario.name} ${scenario.description} ${scenario.content}`);
      const similarity = this.calculateSimilarity(queryTokens, docTokens);
      const tfidf = this.calculateTFIDF(queryTokens, docTokens);
      const relevance = (similarity * 0.6 + tfidf * 0.4) * 1.1; // 10% boost for scenarios

      if (relevance > 0.1) {
        results.push({
          title: scenario.name,
          body: scenario.description || scenario.content?.substring(0, 200),
          source: 'scenario',
          relevance,
          url: `https://github.com/microsoft/AL-Go/blob/main/${scenario.path}`,
          metadata: {
            type: 'Setup Guide'
          }
        });
      }
    }

    // Search discussions (medium weight - Q&A)
    for (const discussion of knowledgeSources.discussions) {
      const docTokens = this.tokenize(`${discussion.title} ${discussion.body}`);
      const similarity = this.calculateSimilarity(queryTokens, docTokens);
      const tfidf = this.calculateTFIDF(queryTokens, docTokens);
      const relevance = similarity * 0.6 + tfidf * 0.4;

      if (relevance > 0.1) {
        results.push({
          title: discussion.title,
          body: discussion.body?.substring(0, 200),
          source: 'discussion',
          relevance,
          url: discussion.url,
          metadata: {
            type: 'Community Q&A',
            itemNumber: discussion.number,
            date: new Date(discussion.updatedAt).toLocaleDateString()
          }
        });
      }
    }

    // Search issues (lower weight - tips & tricks)
    for (const issue of knowledgeSources.issues) {
      const docTokens = this.tokenize(`${issue.title} ${issue.body}`);
      const similarity = this.calculateSimilarity(queryTokens, docTokens);
      const tfidf = this.calculateTFIDF(queryTokens, docTokens);
      const relevance = (similarity * 0.6 + tfidf * 0.4) * 0.8; // 20% reduction for issues

      if (relevance > 0.1) {
        results.push({
          title: issue.title,
          body: issue.body?.substring(0, 200),
          source: 'issue',
          relevance,
          url: issue.url,
          metadata: {
            type: 'Resolved Issue',
            itemNumber: issue.number,
            category: issue.labels?.[0] || 'general',
            date: new Date(issue.updatedAt).toLocaleDateString()
          }
        });
      }
    }

    // Sort by relevance and return top results
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  /**
   * Find similar items to a given item
   */
  findSimilar(
    item: { title: string; body: string },
    knowledgeSources: any[],
    limit: number = 10
  ): SemanticSearchResult[] {
    const queryTokens = this.tokenize(`${item.title} ${item.body}`);

    const results: SemanticSearchResult[] = [];

    for (const source of knowledgeSources) {
      const docTokens = this.tokenize(`${source.title || source.name} ${source.body || source.description}`);
      const similarity = this.calculateSimilarity(queryTokens, docTokens);

      if (similarity > 0.2) {
        results.push({
          title: source.title || source.name,
          body: (source.body || source.description)?.substring(0, 200),
          source: source.source || 'workshop',
          relevance: similarity,
          url: source.url || source.path,
          metadata: {}
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(
    query: string,
    allKnowledge: Array<{ title: string; tags: string[] }>
  ): string[] {
    const queryTerms = this.tokenize(query);
    const suggestions = new Set<string>();

    // Find items with matching terms
    for (const item of allKnowledge) {
      for (const term of queryTerms) {
        if (item.title.toLowerCase().includes(term)) {
          // Add title as suggestion
          if (item.title.length < 100) {
            suggestions.add(item.title);
          }
        }

        // Add tags with matching terms
        for (const tag of item.tags || []) {
          if (tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())) {
            suggestions.add(tag);
          }
        }
      }
    }

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Format search results for display
   */
  formatResults(results: SemanticSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant knowledge found.';
    }

    let output = `Found ${results.length} result(s):\n\n`;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const score = (result.relevance * 100).toFixed(0);

      output += `${i + 1}. **${result.title}** (${result.source})\n`;
      output += `   Relevance: ${score}% | Type: ${result.metadata.type || 'Unknown'}\n`;
      output += `   ${result.body?.substring(0, 150)}...\n`;

      if (result.url) {
        output += `   [View](${result.url})\n`;
      }

      output += '\n';
    }

    return output;
  }
}
