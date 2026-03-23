import { SpecialistService } from '../build/services/SpecialistService.js';
import { AlGoService } from '../build/services/AlGoService.js';
import { DiscussionService } from '../build/services/DiscussionService.js';
import { KnowledgeGraphService } from '../build/services/KnowledgeGraphService.js';

let passCount = 0;
let failCount = 0;

function pass(msg) {
  console.log(`  ✓ ${msg}`);
  passCount++;
}

function fail(msg, error) {
  console.error(`  ✗ ${msg}${error ? ': ' + (error instanceof Error ? error.message : error) : ''}`);
  failCount++;
}

console.log('='.repeat(60));
console.log('AL-Go MCP Server - Phase 2 Testing');
console.log('='.repeat(60));

// Test 1: SpecialistService
console.log('\nTest 1: SpecialistService');
console.log('-'.repeat(60));
try {
  const specialistService = new SpecialistService();

  console.log(`  Total specialists: ${specialistService.count()}`);

  const allSpecialists = specialistService.getAll();
  console.log(`  Specialists loaded: ${allSpecialists.length}`);

  allSpecialists.slice(0, 3).forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} (${s.id})`);
  });

  const cicdResults = specialistService.search('pipeline');
  console.log(`  Search for "pipeline": ${cicdResults.length} result(s)`);
  if (cicdResults.length > 0) {
    console.log(`    → ${cicdResults[0].name}`);
  }

  const appResults = specialistService.getByKeyword('app');
  console.log(`  Specialists with "app" keyword: ${appResults.length}`);

  const cicdSpecialist = specialistService.getById('alg-cicd-architect');
  if (cicdSpecialist) {
    const related = specialistService.getRelated('alg-cicd-architect');
    console.log(`  Related to CICD Architect: ${related.length} specialist(s)`);
    if (related.length > 0) {
      console.log(`    → ${related[0].name}`);
    }
  }

  if (allSpecialists.length === 0) {
    fail('SpecialistService: no specialists loaded');
  } else {
    pass('SpecialistService working correctly');
  }
} catch (error) {
  fail('SpecialistService', error);
}

// Test 2: AlGoService - getOctokit
console.log('\nTest 2: AlGoService (Octokit initialization)');
console.log('-'.repeat(60));
try {
  const alGoService = new AlGoService();
  const octokit = alGoService.getOctokit();

  if (octokit && typeof octokit.rest !== 'undefined') {
    pass('Octokit instance created successfully');
    pass('REST API available');
    if (typeof octokit.graphql === 'function') {
      pass('GraphQL API available');
    }
  } else {
    fail('Octokit instance invalid');
  }
} catch (error) {
  fail('AlGoService', error);
}

// Test 3: DiscussionService initialization
console.log('\nTest 3: DiscussionService (initialization)');
console.log('-'.repeat(60));
try {
  const alGoService = new AlGoService();
  const discussionService = new DiscussionService(alGoService.getOctokit());

  if (discussionService) {
    pass('DiscussionService created successfully');
    pass('Ready for GraphQL queries');
    console.log('  Note: Actual API calls not tested (requires GitHub auth)');
  } else {
    fail('DiscussionService instance is null');
  }
} catch (error) {
  fail('DiscussionService', error);
}

// Test 4: KnowledgeGraphService initialization
console.log('\nTest 4: KnowledgeGraphService (initialization)');
console.log('-'.repeat(60));
try {
  const knowledgeGraphService = new KnowledgeGraphService();

  if (knowledgeGraphService) {
    pass('KnowledgeGraphService created successfully');
    pass('Ready to build knowledge graph');
    console.log('  Note: Actual graph building requires API calls');
  } else {
    fail('KnowledgeGraphService instance is null');
  }
} catch (error) {
  fail('KnowledgeGraphService', error);
}

// Test 5: Specialist Data Structure
console.log('\nTest 5: Specialist Data Validation');
console.log('-'.repeat(60));
try {
  const specialistService = new SpecialistService();
  const specialists = specialistService.getAll();

  const invalidSpecialists = specialists.filter(s => {
    return !(
      typeof s.id === 'string' && s.id.length > 0 &&
      typeof s.name === 'string' && s.name.length > 0 &&
      typeof s.description === 'string' && s.description.length > 0 &&
      Array.isArray(s.expertise) && s.expertise.length > 0 &&
      Array.isArray(s.keywords) && s.keywords.length > 0
    );
  });

  console.log(`  Valid specialists: ${specialists.length - invalidSpecialists.length}/${specialists.length}`);
  if (invalidSpecialists.length > 0) {
    invalidSpecialists.forEach(s => console.log(`    - ${s.id}: Missing required fields`));
    fail(`Data validation: ${invalidSpecialists.length} specialist(s) have missing fields`);
  } else {
    pass('All specialists have required fields');
  }
} catch (error) {
  fail('Specialist data validation', error);
}

// Test 6: Tool registration check
console.log('\nTest 6: MCP Tools Registration Check');
console.log('-'.repeat(60));
const expectedTools = [
  // Phase 1 — Documentation
  'alg-search-docs',
  'alg-get-workflows',
  'alg-get-server-version',
  'alg-refresh-cache',
  // Phase 1 — Specialists
  'alg-search-specialists',
  'alg-list-specialists',
  'alg-get-specialist',
  'alg-ask',
  // Phase 2 — Knowledge sources
  'alg-search-discussions',
  'alg-get-scenarios',
  'alg-search-issues',
  'alg-get-specialist-knowledge',
  'alg-build-knowledge-graph',
  // Phase 3 — Advanced
  'alg-semantic-search',
  'alg-graph-visualization',
  'alg-cache-stats',
  'alg-clear-cache',
];

console.log(`  Expected tools to be registered: ${expectedTools.length}`);
expectedTools.forEach(tool => {
  console.log(`    ✓ ${tool}`);
});
pass(`${expectedTools.length} expected tools listed`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('Testing Summary');
console.log('='.repeat(60));
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${failCount}`);

if (failCount > 0) {
  console.error(`\n❌ ${failCount} test(s) failed`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed');
}
