import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Bm25Index, Ranked } from "./TextSearch.js";

/**
 * Specialist interface
 */
export interface Specialist {
  id: string;
  persona?: string;
  avatarUrl?: string;
  name: string;
  description: string;
  expertise: string[];
  keywords: string[];
  relatedScenarios: string[];
  relatedWorkflows: string[];
}

/**
 * Service for managing AL-Go specialists
 */
export class SpecialistService {
  private specialists: Specialist[] = [];
  private routingIndex?: Bm25Index<Specialist>;

  constructor() {
    this.loadSpecialists();
  }

  /**
   * Load specialists from JSON file
   */
  private loadSpecialists(): void {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const specialistsPath = path.join(__dirname, "..", "data", "specialists.json");

      const data = fs.readFileSync(specialistsPath, "utf8");
      this.specialists = JSON.parse(data);
    } catch (error) {
      console.error("Error loading specialists:", error);
      this.specialists = [];
    }
  }

  /**
   * Get all specialists
   */
  getAll(): Specialist[] {
    return this.specialists;
  }

  /**
   * Get specialist by ID
   */
  getById(id: string): Specialist | undefined {
    return this.specialists.find(s => s.id === id);
  }

  /**
   * Rank specialists for a free-text question, best match first.
   * Specialists sharing no terms with the question are omitted.
   */
  route(question: string): Ranked<Specialist>[] {
    if (!this.routingIndex) {
      // Low length normalisation: a specialist with a longer expertise list shouldn't be penalised
      this.routingIndex = new Bm25Index<Specialist>(1.2, 0.3);
      for (const s of this.specialists) {
        // Keywords are the curated routing signal; descriptive text is grouped in one
        // low-weight field so a term repeated across name/expertise/description doesn't
        // outweigh a rarer, more specific keyword (e.g. "error" -> Rex over "build" -> Bruno)
        this.routingIndex.add(s, [
          { text: s.persona ?? '', weight: 6 },
          { text: s.keywords.join(' '), weight: 4 },
          { text: `${s.name} ${s.expertise.join(' ')} ${s.description}`, weight: 1 }
        ]);
      }
    }
    return this.routingIndex.search(question);
  }

  /**
   * Search specialists by query (ranked)
   */
  search(query: string): Specialist[] {
    return this.route(query).map(r => r.item);
  }

  /**
   * Get specialists by expertise area
   */
  getByExpertise(expertise: string): Specialist[] {
    const lowerExpertise = expertise.toLowerCase();
    return this.specialists.filter(s =>
      s.expertise.some(e => e.toLowerCase().includes(lowerExpertise))
    );
  }

  /**
   * Get specialists related to a keyword
   */
  getByKeyword(keyword: string): Specialist[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.specialists.filter(s =>
      s.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Get related specialists (those that work together)
   */
  getRelated(specialistId: string): Specialist[] {
    const specialist = this.getById(specialistId);
    if (!specialist) return [];

    // Find specialists with overlapping expertise or workflows
    return this.specialists.filter(s =>
      s.id !== specialistId && (
        // Overlapping expertise
        s.expertise.some(e => specialist.expertise.includes(e)) ||
        // Overlapping workflows
        s.relatedWorkflows.some(w => specialist.relatedWorkflows.includes(w)) ||
        // Overlapping scenarios
        s.relatedScenarios.some(sc => specialist.relatedScenarios.includes(sc))
      )
    );
  }

  /**
   * Get specialist by persona name (case-insensitive)
   */
  getByPersona(personaName: string): Specialist | undefined {
    const lower = personaName.toLowerCase().replace(/^@?alg-/, '');
    return this.specialists.find(s => s.persona?.toLowerCase() === lower);
  }

  /**
   * Get specialist count
   */
  count(): number {
    return this.specialists.length;
  }

  /**
   * Format specialist for display
   */
  formatSpecialist(specialist: Specialist): string {
    const header = specialist.persona
      ? `**${specialist.persona}** — ${specialist.name} (${specialist.id})`
      : `**${specialist.name}** (${specialist.id})`;

    const avatarLine = specialist.avatarUrl
      ? `\n![${specialist.persona ?? specialist.name}](${specialist.avatarUrl})\n`
      : '';

    return `
${header}
${avatarLine}
${specialist.description}

**Expertise:**
${specialist.expertise.map(e => `- ${e}`).join('\n')}

**Keywords:** ${specialist.keywords.join(', ')}

**Related Scenarios:** ${specialist.relatedScenarios.length > 0 ? specialist.relatedScenarios.join(', ') : 'None'}

**Related Workflows:** ${specialist.relatedWorkflows.length > 0 ? specialist.relatedWorkflows.join(', ') : 'None'}
    `.trim();
  }

  /**
   * Format multiple specialists
   */
  formatSpecialists(specialists: Specialist[]): string {
    if (specialists.length === 0) {
      return "No specialists found.";
    }

    return specialists
      .map((s, idx) => {
        const label = s.persona ? `**${s.persona}** (${s.name})` : `**${s.name}**`;
        return `${idx + 1}. ${label}: ${s.description}`;
      })
      .join('\n\n');
  }
}
