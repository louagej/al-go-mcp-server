/**
 * Node in the knowledge graph
 */
export interface GraphNode {
  id: string;
  type: 'specialist' | 'knowledge';
  label: string;
  metadata: Record<string, any>;
}

/**
 * Edge connecting nodes in the knowledge graph
 */
export interface GraphEdge {
  from: string;
  to: string;
  type: 'links-to' | 'contains' | 'relates-to';
  weight: number; // 0-1, based on relevance
}

/**
 * Knowledge graph structure for visualization
 */
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalSpecialists: number;
    totalKnowledge: number;
    averageConnections: number;
  };
}

/**
 * API service for knowledge graph visualization and exploration
 */
export class KnowledgeGraphAPI {
  /**
   * Build graph structure for visualization
   */
  buildGraph(
    specialists: any[],
    knowledgeMap: Map<string, any>
  ): KnowledgeGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const edgeMap = new Map<string, GraphEdge>();

    // Add specialist nodes
    for (const specialist of specialists) {
      nodes.push({
        id: specialist.id,
        type: 'specialist' as const,
        label: specialist.name,
        metadata: {
          description: specialist.description,
          expertise: specialist.expertise,
          keywords: specialist.keywords
        }
      });
    }

    // Add knowledge nodes and create edges
    let totalConnections = 0;

    for (const [specialistId, knowledge] of knowledgeMap) {
      const allItems = [
        ...(knowledge.workshops || []),
        ...(knowledge.scenarios || []),
        ...(knowledge.discussions || []),
        ...(knowledge.issues || [])
      ];

      for (const item of allItems) {
        const nodeId = `${item.type}:${item.title.replace(/\s+/g, '_').toLowerCase()}`;

        // Add knowledge node (only once per unique item)
        if (!nodes.find(n => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: 'knowledge' as const,
            label: item.title,
            metadata: {
              source: item.type,
              relevance: item.relevance,
              url: item.url
            }
          });
        }

        // Create edge from specialist to knowledge
        const edgeKey = `${specialistId}→${nodeId}`;
        if (!edgeMap.has(edgeKey)) {
          const edge: GraphEdge = {
            from: specialistId,
            to: nodeId,
            type: 'links-to',
            weight: item.relevance
          };

          edges.push(edge);
          edgeMap.set(edgeKey, edge);
          totalConnections++;
        }
      }
    }

    // Create inter-knowledge edges based on similarity
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].type === 'knowledge' && nodes[j].type === 'knowledge') {
          const similarity = this.calculateNodeSimilarity(nodes[i], nodes[j]);

          if (similarity > 0.5) {
            const edgeKey = `${nodes[i].id}↔${nodes[j].id}`;
            if (!edgeMap.has(edgeKey)) {
              edges.push({
                from: nodes[i].id,
                to: nodes[j].id,
                type: 'relates-to',
                weight: similarity
              });
            }
          }
        }
      }
    }

    const avgConnections = totalConnections > 0 ? totalConnections / specialists.length : 0;

    return {
      nodes,
      edges,
      metadata: {
        totalSpecialists: specialists.length,
        totalKnowledge: nodes.filter(n => n.type === 'knowledge').length,
        averageConnections: avgConnections
      }
    };
  }

  /**
   * Calculate similarity between nodes
   */
  private calculateNodeSimilarity(node1: GraphNode, node2: GraphNode): number {
    if (node1.type !== 'knowledge' || node2.type !== 'knowledge') {
      return 0;
    }

    const label1 = node1.label.toLowerCase();
    const label2 = node2.label.toLowerCase();

    // Simple string similarity
    const common = label1.split(' ').filter(w => label2.includes(w)).length;
    return (common / Math.max(label1.split(' ').length, label2.split(' ').length));
  }

  /**
   * Get subgraph for a specific specialist
   */
  getSpecialistSubgraph(
    specialistId: string,
    graph: KnowledgeGraph,
    depth: number = 1
  ): KnowledgeGraph {
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const queue: Array<{ id: string; d: number }> = [{ id: specialistId, d: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id: currentNode, d: currentDepth } = queue.shift()!;

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      // Add node to subgraph
      const node = graph.nodes.find(n => n.id === currentNode);
      if (node) {
        nodes.set(node.id, node);
      }

      // Do not expand further once the depth limit is reached
      if (currentDepth >= depth) continue;

      // Add edges and connected nodes
      for (const edge of graph.edges) {
        if (edge.from === currentNode) {
          const toNode = graph.nodes.find(n => n.id === edge.to);
          if (toNode) {
            nodes.set(toNode.id, toNode);
            edges.push(edge);
            queue.push({ id: edge.to, d: currentDepth + 1 });
          }
        } else if (edge.to === currentNode) {
          const fromNode = graph.nodes.find(n => n.id === edge.from);
          if (fromNode) {
            nodes.set(fromNode.id, fromNode);
            edges.push(edge);
          }
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
      metadata: {
        totalSpecialists: Array.from(nodes.values()).filter(n => n.type === 'specialist').length,
        totalKnowledge: Array.from(nodes.values()).filter(n => n.type === 'knowledge').length,
        averageConnections: edges.length / nodes.size
      }
    };
  }

  /**
   * Get connected clusters in the graph
   */
  getClusters(graph: KnowledgeGraph): Map<string, GraphNode[]> {
    const clusters = new Map<string, GraphNode[]>();
    const visited = new Set<string>();

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        const cluster = this.dfs(node.id, graph.nodes, graph.edges, visited);
        if (cluster.length > 0) {
          clusters.set(node.id, cluster);
        }
      }
    }

    return clusters;
  }

  /**
   * Depth-first search for connected components
   */
  private dfs(
    nodeId: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
    visited: Set<string>
  ): GraphNode[] {
    const cluster: GraphNode[] = [];
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (visited.has(current)) continue;
      visited.add(current);

      const node = nodes.find(n => n.id === current);
      if (node) {
        cluster.push(node);
      }

      // Find connected nodes
      for (const edge of edges) {
        if (edge.from === current && !visited.has(edge.to)) {
          stack.push(edge.to);
        } else if (edge.to === current && !visited.has(edge.from)) {
          stack.push(edge.from);
        }
      }
    }

    return cluster;
  }

  /**
   * Format graph for visualization (JSON)
   */
  formatForVisualization(graph: KnowledgeGraph): Record<string, any> {
    return {
      nodes: graph.nodes.map(n => ({
        id: n.id,
        label: n.label,
        color: n.type === 'specialist' ? '#FF6B6B' : '#4ECDC4',
        size: n.type === 'specialist' ? 30 : 20,
        ...n.metadata
      })),
      edges: graph.edges.map(e => ({
        from: e.from,
        to: e.to,
        label: e.type.replace('-', ' '),
        value: (e.weight * 5).toFixed(1), // scale for visualization
        title: `${e.type}: ${(e.weight * 100).toFixed(0)}% relevant`
      })),
      metadata: graph.metadata
    };
  }

  /**
   * Get graph statistics
   */
  getStats(graph: KnowledgeGraph): Record<string, any> {
    const specialists = graph.nodes.filter(n => n.type === 'specialist');
    const knowledge = graph.nodes.filter(n => n.type === 'knowledge');

    // Calculate average edges per specialist
    const specilistEdges = graph.edges.filter(e => {
      const fromSpec = specialists.find(s => s.id === e.from);
      return fromSpec !== undefined;
    });

    const avgEdgesPerSpecialist = specialists.length > 0
      ? specilistEdges.length / specialists.length
      : 0;

    // Group knowledge by source
    const bySource = new Map<string, number>();
    for (const node of knowledge) {
      const source = node.metadata.source;
      bySource.set(source, (bySource.get(source) || 0) + 1);
    }

    return {
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      specialists: specialists.length,
      knowledge: knowledge.length,
      averageEdgesPerSpecialist: avgEdgesPerSpecialist.toFixed(2),
      knowledgeBySource: Object.fromEntries(bySource),
      edgeTypes: {
        linksTo: graph.edges.filter(e => e.type === 'links-to').length,
        relatesTo: graph.edges.filter(e => e.type === 'relates-to').length
      }
    };
  }

  /**
   * Format statistics for display
   */
  formatStats(graph: KnowledgeGraph): string {
    const stats = this.getStats(graph);

    let output = `# Knowledge Graph Statistics\n\n`;
    output += `**Overview**\n`;
    output += `- Total Nodes: ${stats.totalNodes}\n`;
    output += `- Total Edges: ${stats.totalEdges}\n`;
    output += `- Specialists: ${stats.specialists}\n`;
    output += `- Knowledge Items: ${stats.knowledge}\n`;
    output += `- Avg Links per Specialist: ${stats.averageEdgesPerSpecialist}\n\n`;

    output += `**Knowledge Distribution**\n`;
    for (const [source, count] of Object.entries(stats.knowledgeBySource)) {
      output += `- ${source}: ${count} items\n`;
    }

    output += `\n**Edge Types**\n`;
    output += `- Links To (specialist→knowledge): ${stats.edgeTypes.linksTo}\n`;
    output += `- Relates To (knowledge↔knowledge): ${stats.edgeTypes.relatesTo}\n`;

    return output;
  }
}
