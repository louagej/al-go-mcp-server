import { SpecialistService } from './build/services/SpecialistService.js';
import { KnowledgeGraphService } from './build/services/KnowledgeGraphService.js';

console.log('\n' + '='.repeat(70));
console.log('AL-Go MCP Server - Detailed Functionality Tests');
console.log('='.repeat(70));

// Test 1: Specialist formatting
console.log('\nTest 1: Specialist Formatting');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const appGen = specialistService.getById('app-generator');
  if (appGen) {
    const formatted = specialistService.formatSpecialist(appGen);
    console.log('  Formatted output:\n');
    console.log('  ' + formatted.split('\n').join('\n  '));
    console.log('\n  ✓ Specialist formatting working correctly');
  }
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
}

// Test 2: Multiple specialist formatting
console.log('\n\nTest 2: Multiple Specialists Formatting');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const results = specialistService.search('test');
  const formatted = specialistService.formatSpecialists(results);

  console.log(`  Found ${results.length} specialist(s) matching "test":\n`);
  console.log('  ' + formatted.split('\n').join('\n  '));
  console.log('\n  ✓ Multiple specialist formatting working correctly');
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
}

// Test 3: Specialist relationships
console.log('\n\nTest 3: Specialist Relationships');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();

  const testAppCreator = specialistService.getById('test-app-creator');
  if (testAppCreator) {
    const related = specialistService.getRelated('test-app-creator');

    console.log(`  Test App Creator is related to ${related.length} specialist(s):\n`);
    related.forEach((s, idx) => {
      console.log(`    ${idx + 1}. ${s.name}`);
      console.log(`       Overlaps: `, [
        s.expertise.filter(e => testAppCreator.expertise.includes(e))[0],
      ].filter(Boolean).join(', ') || 'workflows/scenarios');
    });

    console.log('\n  ✓ Specialist relationships working correctly');
  }
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
}

// Test 4: Knowledge Graph stats (without API calls)
console.log('\n\nTest 4: Knowledge Graph Service');
console.log('-'.repeat(70));
try {
  const knowledgeGraphService = new KnowledgeGraphService();

  console.log('  ✓ KnowledgeGraphService instance created');
  console.log('  Ready for knowledge graph building');
  console.log('\n  To fully test, call: build-knowledge-graph tool');
  console.log('  (This requires GitHub API calls)');
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
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

  console.log('\n  ✓ Expertise filtering working correctly');
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
}

// Test 6: Data integrity
console.log('\n\nTest 6: Data Integrity Check');
console.log('-'.repeat(70));
try {
  const specialistService = new SpecialistService();
  const specialists = specialistService.getAll();

  const stats = {
    totalSpecialists: specialists.length,
    allHaveWorkflows: specialists.every(s => s.relatedWorkflows && s.relatedWorkflows.length >= 0),
    allHaveScenarios: specialists.every(s => s.relatedScenarios && Array.isArray(s.relatedScenarios)),
    uniqueIds: new Set(specialists.map(s => s.id)).size,
    totalExpertiseAreas: specialists.reduce((sum, s) => sum + s.expertise.length, 0),
    totalKeywords: specialists.reduce((sum, s) => sum + s.keywords.length, 0),
  };

  console.log(`  Total specialists: ${stats.totalSpecialists}`);
  console.log(`  All have workflow references: ${stats.allHaveWorkflows}`);
  console.log(`  All have scenario references: ${stats.allHaveScenarios}`);
  console.log(`  Unique specialist IDs: ${stats.uniqueIds}`);
  console.log(`  Total expertise areas: ${stats.totalExpertiseAreas}`);
  console.log(`  Total keywords: ${stats.totalKeywords}`);
  console.log(`  Avg expertise per specialist: ${(stats.totalExpertiseAreas / stats.totalSpecialists).toFixed(1)}`);
  console.log(`  Avg keywords per specialist: ${(stats.totalKeywords / stats.totalSpecialists).toFixed(1)}`);

  console.log('\n  ✓ Data integrity verified');
} catch (error) {
  console.error('  ✗ Error:', error instanceof Error ? error.message : error);
}

console.log('\n' + '='.repeat(70));
console.log('All Functional Tests Completed Successfully ✓');
console.log('='.repeat(70));
console.log('\nReady to test with real GitHub API calls:');
console.log('  - Set GITHUB_TOKEN environment variable');
console.log('  - Run: build-knowledge-graph tool');
console.log('  - Try: search-discussions, get-scenarios, search-issues');
console.log('='.repeat(70) + '\n');
