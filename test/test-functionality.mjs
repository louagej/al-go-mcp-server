import { SpecialistService } from '../build/services/SpecialistService.js';
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

console.log('\n' + '='.repeat(70));
console.log('AL-Go MCP Server - Detailed Functionality Tests');
console.log('='.repeat(70));

// Test 1: Specialist formatting
console.log('\nTest 1: Specialist Formatting');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const appGen = specialistService.getById('alg-app-generator');
  if (appGen) {
    const formatted = specialistService.formatSpecialist(appGen);
    console.log('  Formatted output:\n');
    console.log('  ' + formatted.split('\n').join('\n  '));
    pass('Specialist formatting working correctly');
  } else {
    fail('Specialist "alg-app-generator" not found');
  }
} catch (error) {
  fail('Specialist formatting', error);
}

// Test 2: Multiple specialist formatting
console.log('\n\nTest 2: Multiple Specialists Formatting');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const results = specialistService.search('test');
  if (results.length === 0) {
    fail('Search for "test" returned no results');
  } else {
    const formatted = specialistService.formatSpecialists(results);
    console.log(`  Found ${results.length} specialist(s) matching "test":\n`);
    console.log('  ' + formatted.split('\n').join('\n  '));
    pass('Multiple specialist formatting working correctly');
  }
} catch (error) {
  fail('Multiple specialist formatting', error);
}

// Test 3: Specialist relationships
console.log('\n\nTest 3: Specialist Relationships');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const testAppCreator = specialistService.getById('alg-test-app-creator');
  if (testAppCreator) {
    const related = specialistService.getRelated('alg-test-app-creator');

    console.log(`  Test App Creator is related to ${related.length} specialist(s):\n`);
    related.forEach((s, idx) => {
      console.log(`    ${idx + 1}. ${s.name}`);
      const overlap = s.expertise.find(e => testAppCreator.expertise.includes(e));
      if (overlap) console.log(`       Overlap: ${overlap}`);
    });

    pass('Specialist relationships working correctly');
  } else {
    fail('Specialist "alg-test-app-creator" not found');
  }
} catch (error) {
  fail('Specialist relationships', error);
}

// Test 4: Knowledge Graph stats (without API calls)
console.log('\n\nTest 4: Knowledge Graph Service');
console.log('-'.repeat(70));
try {
  const knowledgeGraphService = new KnowledgeGraphService();
  pass('KnowledgeGraphService instance created');
  console.log('  Ready for knowledge graph building');
  console.log('\n  To fully test, call: build-knowledge-graph tool');
  console.log('  (This requires GitHub API calls)');
} catch (error) {
  fail('KnowledgeGraphService initialization', error);
}

// Test 5: Specialist by expertise
console.log('\n\nTest 5: Specialists by Expertise');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const buildExperts = specialistService.getByExpertise('build');
  console.log(`  Specialists with "build" expertise: ${buildExperts.length}\n`);

  buildExperts.slice(0, 3).forEach((s, idx) => {
    console.log(`    ${idx + 1}. ${s.name}`);
  });

  if (buildExperts.length === 0) {
    fail('No specialists found with "build" expertise');
  } else {
    pass('Expertise filtering working correctly');
  }
} catch (error) {
  fail('Expertise filtering', error);
}

// Test 6: Data integrity
console.log('\n\nTest 6: Data Integrity Check');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();
  const specialists = specialistService.getAll();

  const totalSpecialists = specialists.length;
  const allHaveWorkflows = specialists.every(s => Array.isArray(s.relatedWorkflows));
  const allHaveScenarios = specialists.every(s => s.relatedScenarios && Array.isArray(s.relatedScenarios));
  const uniqueIds = new Set(specialists.map(s => s.id)).size;
  const totalExpertiseAreas = specialists.reduce((sum, s) => sum + s.expertise.length, 0);
  const totalKeywords = specialists.reduce((sum, s) => sum + s.keywords.length, 0);

  const avgExpertise = totalSpecialists > 0 ? (totalExpertiseAreas / totalSpecialists).toFixed(1) : 'N/A';
  const avgKeywords  = totalSpecialists > 0 ? (totalKeywords / totalSpecialists).toFixed(1) : 'N/A';

  console.log(`  Total specialists: ${totalSpecialists}`);
  console.log(`  All have workflow references: ${allHaveWorkflows}`);
  console.log(`  All have scenario references: ${allHaveScenarios}`);
  console.log(`  Unique specialist IDs: ${uniqueIds}`);
  console.log(`  Total expertise areas: ${totalExpertiseAreas}`);
  console.log(`  Total keywords: ${totalKeywords}`);
  console.log(`  Avg expertise per specialist: ${avgExpertise}`);
  console.log(`  Avg keywords per specialist: ${avgKeywords}`);

  const integrityIssues = [];
  if (totalSpecialists === 0) integrityIssues.push('No specialists loaded');
  if (uniqueIds !== totalSpecialists) integrityIssues.push('Duplicate specialist IDs found');
  if (!allHaveWorkflows) integrityIssues.push('Some specialists missing workflow references');
  if (!allHaveScenarios) integrityIssues.push('Some specialists missing scenario references');

  if (integrityIssues.length > 0) {
    integrityIssues.forEach(issue => fail(issue));
  } else {
    pass('Data integrity verified');
  }
} catch (error) {
  fail('Data integrity check', error);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('Functional Tests Summary');
console.log('='.repeat(70));
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${failCount}`);

if (failCount > 0) {
  console.error(`\n❌ ${failCount} test(s) failed`);
  process.exit(1);
} else {
  console.log('\n✅ All functional tests passed');
}
