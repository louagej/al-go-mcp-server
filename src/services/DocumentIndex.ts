import { DocFile } from "./AlGoService.js";
import { Bm25Index, tokenize } from "./TextSearch.js";

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
}

/**
 * Anything that can supply AL-Go documentation files (AlGoService, or a fake in tests)
 */
export interface DocSource {
  getDocumentationFiles(): Promise<DocFile[]>;
}

/**
 * Service for indexing and searching AL-Go documentation.
 * Documents come from the AlGoService cache; the search index is rebuilt
 * whenever that cache hands back a new document set.
 */
export class DocumentIndex {
  private indexedDocs: DocFile[] | null = null;
  private index = new Bm25Index<DocumentEntry>();

  /**
   * Make sure the index reflects the current (cached) document set
   */
  async initialize(source: DocSource): Promise<void> {
    const docs = await source.getDocumentationFiles();
    if (docs === this.indexedDocs) return;

    if (docs.length === 0) {
      throw new Error("No AL-Go documents could be fetched");
    }

    const index = new Bm25Index<DocumentEntry>();
    for (const doc of docs) {
      const entry: DocumentEntry = {
        path: doc.path,
        content: doc.content,
        name: doc.name,
        title: this.extractTitle(doc.content, doc.name)
      };
      index.add(entry, [
        { text: entry.title, weight: 4 },
        { text: entry.path, weight: 3 },
        { text: this.extractHeadings(doc.content), weight: 2 },
        { text: doc.content, weight: 1 }
      ]);
    }

    this.index = index;
    this.indexedDocs = docs;
    console.error(`Indexed ${index.size} AL-Go documents`);
  }

  /**
   * Search through the indexed documents, loading the index on first use
   */
  async search(source: DocSource, query: string, limit: number = 10): Promise<SearchResult[]> {
    await this.initialize(source);

    return this.index.search(query, limit).map(({ item, score }) => ({
      title: item.title,
      path: item.path,
      excerpt: this.extractExcerpt(item.content, query),
      score,
      content: item.content.substring(0, 1000) // Limit content to avoid overwhelming responses
    }));
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
   * All markdown headings, used as a boosted search field
   */
  private extractHeadings(content: string): string {
    return (content.match(/^#+\s+.+$/gm) || []).join('\n');
  }

  /**
   * Extract the line with the most query terms, plus surrounding context
   */
  private extractExcerpt(content: string, query: string, maxLength: number = 200): string {
    const terms = new Set(tokenize(query));
    const lines = content.split('\n');

    let bestLine = -1;
    let bestHits = 0;
    lines.forEach((line, i) => {
      if (/^\s*(#|!\[|<)/.test(line)) return; // skip headings, images, HTML
      const hits = new Set(tokenize(line).filter(t => terms.has(t))).size;
      if (hits > bestHits) {
        bestHits = hits;
        bestLine = i;
      }
    });

    const text = (bestLine === -1 ? lines : lines.slice(bestLine))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const excerpt = text.substring(0, maxLength);
    return (bestLine > 0 ? '...' : '') + excerpt + (text.length > maxLength ? '...' : '');
  }
}
