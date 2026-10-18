/**
 * Shared text ranking used by documentation search, semantic search,
 * issue/discussion search and specialist routing.
 *
 * Implements BM25 with per-field weights (a simplified BM25F): a term found in
 * a title or path counts more than the same term in body text, and long
 * documents don't win just because they mention a term many times.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
  'for', 'from', 'get', 'got', 'have', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'should', 'so', 'than',
  'that', 'the', 'their', 'then', 'there', 'these', 'this', 'to', 'use', 'using',
  'was', 'we', 'what', 'when', 'where', 'which', 'why', 'will', 'with', 'you',
  'your',
  // Present in virtually every AL-Go document, so they carry no signal
  'al', 'go', 'algo'
]);

/**
 * Light suffix stripping so "releases", "released", "releasing" and "release"
 * all reduce to the same stem. Applied identically to queries and documents,
 * so stems only need to be consistent, not real words.
 */
export function stem(word: string): string {
  let w = word;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/**
 * Split text into stemmed search terms. Splits camelCase/PascalCase so file
 * names like "CreateRelease.md" yield "create" and "release".
 */
export function tokenize(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t))
    .map(stem);
}

export interface Field {
  text: string;
  weight: number;
}

export interface Ranked<T> {
  item: T;
  score: number;
}

interface IndexedField {
  termFreq: Map<string, number>;
  length: number;
  weight: number;
}

interface IndexedDoc<T> {
  item: T;
  fields: IndexedField[];
}

/**
 * In-memory BM25 index over a fixed set of items.
 * Each field is scored with its own length normalisation and the weighted
 * field scores are summed, so a title match adds to a body match instead of
 * both saturating into the same capped term frequency.
 */
export class Bm25Index<T> {
  private docs: IndexedDoc<T>[] = [];
  private docFreq = new Map<string, number>();
  // Total length per field position, for the per-field average
  private fieldLengthTotals: number[] = [];

  constructor(private readonly k1 = 1.2, private readonly b = 0.75) {}

  add(item: T, fields: Field[]): void {
    const docTerms = new Set<string>();
    const indexed = fields.map((field, i) => {
      const termFreq = new Map<string, number>();
      const tokens = tokenize(field.text);
      for (const term of tokens) {
        termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
        docTerms.add(term);
      }
      this.fieldLengthTotals[i] = (this.fieldLengthTotals[i] ?? 0) + tokens.length;
      return { termFreq, length: tokens.length, weight: field.weight };
    });
    for (const term of docTerms) {
      this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
    }
    this.docs.push({ item, fields: indexed });
  }

  get size(): number {
    return this.docs.length;
  }

  /**
   * Rank items for a query. Items matching none of the query terms are omitted.
   * Scores are scaled by the share of distinct query terms matched, so a document
   * covering every term outranks one that repeats a single term.
   */
  search(query: string, limit = Infinity): Ranked<T>[] {
    const terms = [...new Set(tokenize(query))];
    if (terms.length === 0 || this.docs.length === 0) return [];

    const n = this.docs.length;
    const avgLengths = this.fieldLengthTotals.map(total => total / n || 1);
    const results: Ranked<T>[] = [];

    for (const doc of this.docs) {
      let score = 0;
      let matched = 0;
      for (const term of terms) {
        let termScore = 0;
        doc.fields.forEach((field, i) => {
          const tf = field.termFreq.get(term);
          if (!tf) return;
          const norm = 1 - this.b + this.b * field.length / avgLengths[i];
          termScore += field.weight * (tf * (this.k1 + 1)) / (tf + this.k1 * norm);
        });
        if (termScore === 0) continue;
        matched++;
        const df = this.docFreq.get(term) ?? 0;
        score += Math.log(1 + (n - df + 0.5) / (df + 0.5)) * termScore;
      }
      if (matched > 0) {
        results.push({ item: doc.item, score: score * (0.5 + 0.5 * matched / terms.length) });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
