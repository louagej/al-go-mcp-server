import { Bm25Index, Field } from "./TextSearch.js";

/**
 * Semantic search result with relevance score
 */
export interface SemanticSearchResult {
  title: string;
  body: string;
  source: 'workshop' | 'scenario' | 'discussion' | 'issue';
  relevance: number; // 0-1, relative to the best result
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
 * Service for ranked search across all knowledge sources.
 * All sources share one BM25 index, so term rarity is measured across the
 * whole collection; source weights then favour curated docs over Q&A.
 */
export class SemanticSearchService {
  // Workshops are foundational, scenarios are setup guides, issues are last-resort tips
  private readonly sourceWeights: Record<SemanticSearchResult['source'], number> = {
    workshop: 1.2,
    scenario: 1.1,
    discussion: 1.0,
    issue: 0.8
  };

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
    const index = new Bm25Index<SemanticSearchResult>();
    const add = (result: SemanticSearchResult, fields: Field[]) => index.add(result, fields);

    for (const workshop of knowledgeSources.workshops) {
      add({
        title: workshop.name,
        body: workshop.description || workshop.content?.substring(0, 200),
        source: 'workshop',
        relevance: 0,
        url: `https://github.com/microsoft/AL-Go/blob/main/${workshop.path}`,
        metadata: { type: 'Foundational Knowledge' }
      }, [
        { text: workshop.name, weight: 3 },
        { text: workshop.content ?? workshop.description ?? '', weight: 1 }
      ]);
    }

    for (const scenario of knowledgeSources.scenarios) {
      add({
        title: scenario.name,
        body: scenario.description || scenario.content?.substring(0, 200),
        source: 'scenario',
        relevance: 0,
        url: `https://github.com/microsoft/AL-Go/blob/main/${scenario.path}`,
        metadata: { type: 'Setup Guide' }
      }, [
        { text: scenario.name, weight: 3 },
        { text: scenario.content ?? scenario.description ?? '', weight: 1 }
      ]);
    }

    for (const discussion of knowledgeSources.discussions) {
      add({
        title: discussion.title,
        body: discussion.body?.substring(0, 200),
        source: 'discussion',
        relevance: 0,
        url: discussion.url,
        metadata: {
          type: 'Community Q&A',
          itemNumber: discussion.number,
          date: new Date(discussion.updatedAt).toLocaleDateString()
        }
      }, [
        { text: discussion.title, weight: 3 },
        { text: discussion.body ?? '', weight: 1 }
      ]);
    }

    for (const issue of knowledgeSources.issues) {
      add({
        title: issue.title,
        body: issue.body?.substring(0, 200),
        source: 'issue',
        relevance: 0,
        url: issue.url,
        metadata: {
          type: 'Resolved Issue',
          itemNumber: issue.number,
          category: issue.labels?.[0] || 'general',
          date: new Date(issue.updatedAt).toLocaleDateString()
        }
      }, [
        { text: issue.title, weight: 3 },
        { text: issue.body ?? '', weight: 1 }
      ]);
    }

    const weighted = index.search(query).map(({ item, score }) => ({
      item,
      score: score * this.sourceWeights[item.source]
    }));
    if (weighted.length === 0) return [];

    const best = Math.max(...weighted.map(r => r.score));
    return weighted
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item, score }) => ({ ...item, relevance: score / best }));
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
