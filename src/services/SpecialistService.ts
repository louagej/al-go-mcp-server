import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
   * Search specialists by query
   */
  search(query: string): Specialist[] {
    const lowerQuery = query.toLowerCase();

    return this.specialists.filter(specialist => {
      const matchesName = specialist.name.toLowerCase().includes(lowerQuery);
      const matchesPersona = specialist.persona?.toLowerCase().includes(lowerQuery) ?? false;
      const matchesDescription = specialist.description.toLowerCase().includes(lowerQuery);
      const matchesExpertise = specialist.expertise.some(e => e.toLowerCase().includes(lowerQuery));
      const matchesKeywords = specialist.keywords.some(k => k.toLowerCase().includes(lowerQuery));

      return matchesName || matchesPersona || matchesDescription || matchesExpertise || matchesKeywords;
    });
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
