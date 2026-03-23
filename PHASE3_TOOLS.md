# Phase 3 Tools Quick Reference

## Caching System: `cache-stats` & `clear-cache`

### Tool: `cache-stats`
Get cache performance metrics and configuration

**Usage Example**:
```json
{
  "sourceFilter": "discussion"
}
```

**Output** (example):
```
Cache Statistics
Total items: 42

**WORKSHOP**
  Hits: 125 | Misses: 8 | Hit Rate: 93.9%
  Refreshes: 2 | TTL: 24h

**SCENARIO**
  Hits: 89 | Misses: 5 | Hit Rate: 94.6%
  Refreshes: 1 | TTL: 24h

**DISCUSSION**
  Hits: 156 | Misses: 23 | Hit Rate: 87.1%
  Refreshes: 5 | TTL: 6h

**ISSUE**
  Hits: 67 | Misses: 12 | Hit Rate: 84.8%
  Refreshes: 3 | TTL: 12h
```

---

### Tool: `clear-cache`
Selectively clear cached items

**Examples**:

Clear all cache:
```json
{
  "scope": "all"
}
```

Clear only expired items:
```json
{
  "scope": "expired"
}
```

Clear specific source:
```json
{
  "scope": "source",
  "source": "discussion"
}
```

---

## Semantic Search: `semantic-search`

### Tool: `semantic-search`
Intelligent cross-source search with relevance ranking

**Algorithm**: TF-IDF + Jaccard Similarity
**Source Weights**:
- Workshops: 1.2x (highest priority)
- Scenarios: 1.1x (high priority)
- Discussions: 1.0x (normal)
- Issues: 0.8x (lower priority)

**Examples**:

Search for "authentication":
```json
{
  "query": "authentication patterns"
}
```

Search with limit:
```json
{
  "query": "CI/CD pipeline",
  "limit": 5
}
```

Search within specialist expertise:
```json
{
  "query": "app creation",
  "sourceFilter": "specialist"
}
```

**Output** (example):
```
SEARCH RESULTS FOR "authentication patterns"

1. Authentication Flow Specialist [specialist] - Relevance: 0.98
   Expert in identity, authorization, multi-factor setup

2. GitHub Authentication Setup (Workshop) - Relevance: 0.94
   Found in Workshop/AuthenticationSetup.md
   Context: "...authentication patterns for secure..."

3. OAuth Implementation Discussion - Relevance: 0.87
   2 relevant comments, 12 upvotes
   Category: Security Best Practices
```

---

## Knowledge Graph Visualization: `graph-visualization`

### Tool: `graph-visualization`
Visualize specialist relationships and knowledge connections

**Format Options**:
- `json`: Machine-readable graph structure
- `text`: Human-readable statistics and clusters

**Examples**:

Get graph as JSON:
```json
{
  "format": "json",
  "includeClusters": true
}
```

Get graph statistics:
```json
{
  "format": "text"
}
```

**JSON Output** (example structure):
```json
{
  "nodes": [
    {
      "id": "app-generator",
      "type": "specialist",
      "label": "App Generator Specialist",
      "metadata": {
        "description": "Create new Business Central applications..."
      }
    },
    {
      "id": "github-auth-workshop",
      "type": "knowledge",
      "label": "GitHub Authentication Setup",
      "metadata": {
        "source": "workshop",
        "file": "Workshop/AuthenticationSetup.md"
      }
    }
  ],
  "edges": [
    {
      "from": "app-generator",
      "to": "cicd-architect",
      "type": "relates-to",
      "weight": 0.85
    }
  ],
  "metadata": {
    "totalSpecialists": 16,
    "totalKnowledge": 128,
    "averageConnections": 3.2
  }
}
```

**Text Output** (example):
```
Knowledge Graph Statistics
========================

Total Nodes: 144 (16 specialists, 128 knowledge sources)
Total Connections: 256 edges
Average Connections per Specialist: 3.2

Cluster Analysis:
---------
Cluster 1: App Development (5 specialists)
  - App Generator
  - App Creator
  - Current Version Test
  - Test App Creator
  - Project Creator

Cluster 2: CI/CD & Deployment (3 specialists)
  - CI/CD Architect
  - Build Manager
  - PR Build Engineer

[... more clusters ...]

Most Connected Specialists:
1. CI/CD Architect (12 connections)
2. Build Manager (10 connections)
3. App Generator (9 connections)
```

---

## Recommended Workflows

### Workflow 1: Cache Optimization
```bash
# 1. Check current cache stats
cache-stats

# 2. Monitor hit rates
cache-stats --sourceFilter "discussion"

# 3. Clear old entries
clear-cache --scope "expired"

# 4. Verify improvement
cache-stats
```

### Workflow 2: Knowledge Discovery
```bash
# 1. Search for relevant content
semantic-search --query "your topic"

# 2. Explore related specialists
graph-visualization --format "json"

# 3. Find clusters
graph-visualization --format "text" --includeClusters
```

### Workflow 3: Performance Monitoring
```bash
# 1. Check cache metrics
cache-stats

# 2. Search performance
semantic-search --query "test" --sourceFilter "specialist"

# 3. Graph analysis
graph-visualization --format "text"
```

---

## Integration with Existing Tools

### Combined Workflow: Complete Knowledge Exploration

```bash
# Step 1: Build full knowledge graph
build-knowledge-graph --includeAll

# Step 2: Search for relevant topics
semantic-search --query "your topic"

# Step 3: View graph clusters
graph-visualization --format "text" --includeClusters

# Step 4: Monitor cache performance
cache-stats

# Step 5: Get specialist details
get-specialist-knowledge --specialistId "app-generator"
```

---

## Performance Tips

1. **Cache Management**
   - Monitor hit rates with `cache-stats`
   - Clear expired items daily with `clear-cache --scope expired`
   - Track cache size trends

2. **Semantic Search**
   - Start with broad queries, filter by source
   - Use `sourceFilter` to narrow results
   - Leverage relevance scores (top results = best matches)

3. **Graph Visualization**
   - Use `format: "text"` for quick summaries
   - Use `format: "json"` for programmatic access
   - Check clusters for specialist groups

---

## Error Handling

All tools include comprehensive error messages:

```
Error: Cache manager not initialized
→ Try: Restart MCP server

Error: Semantic search query empty
→ Try: Provide a search term

Error: Graph visualization failed
→ Try: Check GitHub token (for full API data)
```

---

## Configuration Reference

### Cache TTLs (configured in CacheManager)
```
Workshop: 24 hours
Scenario: 24 hours
Discussion: 6 hours
Issue: 12 hours
```

### Semantic Search Weights
```
Workshop: 1.2x
Scenario: 1.1x
Discussion: 1.0x (baseline)
Issue: 0.8x
```

### Graph Types
```
Specialist (specialist) → All 16 domain experts
Knowledge (knowledge) → All integrated sources
Relationship (relates-to) → Expertise connections
```

---

## See Also

- **PHASE3_COMPLETE.md** - Full implementation details
- **TEST_REPORT.md** - Comprehensive test results
- **TESTING_SUMMARY.md** - Testing overview
- **src/services/CacheManager.ts** - Caching implementation
- **src/services/SemanticSearchService.ts** - Search algorithm
- **src/services/KnowledgeGraphAPI.ts** - Graph structure
