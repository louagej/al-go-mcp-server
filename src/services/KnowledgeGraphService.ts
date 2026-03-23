import { Specialist } from "./SpecialistService.js";

/**
 * Knowledge source interface
 */
export interface KnowledgeSource {
  type: 'workshop' | 'scenario' | 'discussion' | 'issue';
  title: string;
  body: string;
  url: string;
  relevance: number; // 0-1 relevance score
  specialist?: string; // Linked specialist ID
  number?: number; // For discussions/issues
  createdAt: string;
}

/**
 * Specialist knowledge interface
 */
export interface SpecialistKnowledge {
  specialist: Specialist;
  workshops: KnowledgeSource[];
  scenarios: KnowledgeSource[];
  discussions: KnowledgeSource[];
  issues: KnowledgeSource[];
}

/**
 * Service for building and managing the knowledge graph
 * Links specialists to knowledge sources (workshops, scenarios, discussions, issues)
 */
export class KnowledgeGraphService {
  private knowledgeGraph: Map<string, SpecialistKnowledge> = new Map();
  private keywordIndex: Map<string, string[]> = new Map(); // keyword -> specialist IDs

  /**
   * Build/rebuild the knowledge graph
   */
  async buildKnowledgeGraph(
    specialists: Specialist[],
    workshops: any[],
    scenarios: any[],
    discussions: any[],
    issues: any[]
  ): Promise<void> {
    // Clear stale data before rebuilding
    this.knowledgeGraph.clear();
    this.keywordIndex.clear();

    // Initialize graph for each specialist
    for (const specialist of specialists) {
      this.knowledgeGraph.set(specialist.id, {
        specialist,
        workshops: [],
        scenarios: [],
        discussions: [],
        issues: []
      });

      // Index keywords
      specialist.keywords.forEach(keyword => {
        if (!this.keywordIndex.has(keyword.toLowerCase())) {
          this.keywordIndex.set(keyword.toLowerCase(), []);
        }
        this.keywordIndex.get(keyword.toLowerCase())!.push(specialist.id);
      });
    }

    // Link workshops (common to all specialists from their relatedScenarios)
    for (const specialist of specialists) {
      for (const workshop of workshops) {
        const relevance = this.calculateRelevance(workshop.description, specialist.expertise);
        if (relevance > 0.3) {
          this.knowledgeGraph.get(specialist.id)?.workshops.push({
            type: 'workshop',
            title: workshop.name,
            body: workshop.description,
            url: `https://github.com/microsoft/AL-Go/blob/main/${workshop.path}`,
            relevance,
            specialist: specialist.id,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Link scenarios to specialists
    for (const specialist of specialists) {
      for (const scenario of scenarios) {
        // Check if scenario name matches specialist's related scenarios
        const isRelated = specialist.relatedScenarios.some(s =>
          scenario.name.toLowerCase().includes(s.replace('.md', '').toLowerCase())
        );

        if (isRelated) {
          const relevance = 0.95; // High relevance if explicitly related
          this.knowledgeGraph.get(specialist.id)?.scenarios.push({
            type: 'scenario',
            title: scenario.name,
            body: scenario.description,
            url: `https://github.com/microsoft/AL-Go/blob/main/${scenario.path}`,
            relevance,
            specialist: specialist.id,
            createdAt: new Date().toISOString()
          });
        } else {
          const relevance = this.calculateRelevance(scenario.description, specialist.expertise);
          if (relevance > 0.4) {
            this.knowledgeGraph.get(specialist.id)?.scenarios.push({
              type: 'scenario',
              title: scenario.name,
              body: scenario.description,
              url: `https://github.com/microsoft/AL-Go/blob/main/${scenario.path}`,
              relevance,
              specialist: specialist.id,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }

    // Link discussions to specialists
    for (const specialist of specialists) {
      for (const discussion of discussions) {
        const relevance = this.calculateRelevance(
          `${discussion.title} ${discussion.body}`,
          specialist.expertise
        );

        if (relevance > 0.3) {
          this.knowledgeGraph.get(specialist.id)?.discussions.push({
            type: 'discussion',
            title: discussion.title,
            body: discussion.body.substring(0, 200),
            url: discussion.url,
            relevance,
            specialist: specialist.id,
            number: discussion.number,
            createdAt: discussion.updatedAt
          });
        }
      }
    }

    // Link issues to specialists
    for (const specialist of specialists) {
      for (const issue of issues) {
        const relevance = this.calculateRelevance(
          `${issue.title} ${issue.body}`,
          specialist.expertise
        );

        if (relevance > 0.25) {
          this.knowledgeGraph.get(specialist.id)?.issues.push({
            type: 'issue',
            title: issue.title,
            body: issue.body.substring(0, 200),
            url: issue.url,
            relevance,
            specialist: specialist.id,
            number: issue.number,
            createdAt: issue.updatedAt
          });
        }
      }
    }

    // Sort all knowledge sources by relevance
    for (const knowledge of this.knowledgeGraph.values()) {
      knowledge.workshops.sort((a, b) => b.relevance - a.relevance);
      knowledge.scenarios.sort((a, b) => b.relevance - a.relevance);
      knowledge.discussions.sort((a, b) => b.relevance - a.relevance);
      knowledge.issues.sort((a, b) => b.relevance - a.relevance);
    }
  }

  /**
   * Calculate relevance score between text and expertise areas
   * Returns 0-1 score
   */
  private calculateRelevance(text: string, expertise: string[]): number {
    if (!text) return 0;

    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const exp of expertise) {
      const parts = exp.toLowerCase().split(/\s+/);
      for (const part of parts) {
        if (part.length > 3 && lowerText.includes(part)) {
          matches++;
        }
      }
    }

    return Math.min(1, matches / expertise.length);
  }

  /**
   * Get specialist knowledge
   */
  getSpecialistKnowledge(specialistId: string): SpecialistKnowledge | undefined {
    return this.knowledgeGraph.get(specialistId);
  }

  /**
   * Get all knowledge for a specialist formatted for display
   */
  formatSpecialistKnowledge(specialistId: string): string {
    const knowledge = this.getSpecialistKnowledge(specialistId);
    if (!knowledge) return "Specialist not found";

    let output = `# Knowledge for ${knowledge.specialist.name}\n\n`;

    if (knowledge.workshops.length > 0) {
      output += `## Workshops (Foundation)\n`;
      knowledge.workshops.forEach(w => {
        output += `- [${w.title}](${w.url}) - Relevance: ${(w.relevance * 100).toFixed(0)}%\n`;
      });
      output += '\n';
    }

    if (knowledge.scenarios.length > 0) {
      output += `## Scenarios\n`;
      knowledge.scenarios.forEach(s => {
        output += `- [${s.title}](${s.url}) - Relevance: ${(s.relevance * 100).toFixed(0)}%\n`;
      });
      output += '\n';
    }

    if (knowledge.discussions.length > 0) {
      output += `## Community Discussions\n`;
      knowledge.discussions.slice(0, 5).forEach(d => {
        output += `- [${d.title}](${d.url}) - Relevance: ${(d.relevance * 100).toFixed(0)}%\n`;
      });
      if (knowledge.discussions.length > 5) {
        output += `- ... and ${knowledge.discussions.length - 5} more discussions\n`;
      }
      output += '\n';
    }

    if (knowledge.issues.length > 0) {
      output += `## Resolved Issues (Tips & Tricks)\n`;
      knowledge.issues.slice(0, 5).forEach(i => {
        output += `- [${i.title}](${i.url}) - Relevance: ${(i.relevance * 100).toFixed(0)}%\n`;
      });
      if (knowledge.issues.length > 5) {
        output += `- ... and ${knowledge.issues.length - 5} more issues\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Get specialists related to a keyword
   */
  getSpecialistsByKeyword(keyword: string): string[] {
    return this.keywordIndex.get(keyword.toLowerCase()) || [];
  }

  /**
   * Get knowledge graph statistics
   */
  getStats(): {
    totalSpecialists: number;
    specialistStats: Record<string, {
      workshops: number;
      scenarios: number;
      discussions: number;
      issues: number;
    }>;
  } {
    const stats: Record<string, any> = {};

    for (const [specialistId, knowledge] of this.knowledgeGraph) {
      stats[specialistId] = {
        workshops: knowledge.workshops.length,
        scenarios: knowledge.scenarios.length,
        discussions: knowledge.discussions.length,
        issues: knowledge.issues.length
      };
    }

    return {
      totalSpecialists: this.knowledgeGraph.size,
      specialistStats: stats
    };
  }
}
