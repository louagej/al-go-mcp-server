import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpecialistService } from '../build/services/SpecialistService.js';

const svc = new SpecialistService();

test('specialist data is complete and unique', () => {
  const all = svc.getAll();
  assert.equal(all.length, 16);
  assert.equal(new Set(all.map(s => s.id)).size, all.length, 'ids must be unique');
  assert.equal(new Set(all.map(s => s.persona)).size, all.length, 'personas must be unique');
  for (const s of all) {
    assert.match(s.id, /^alg-[a-z]+$/);
    assert.equal(s.id, `alg-${s.persona.toLowerCase()}`, `${s.id} id should match persona`);
    for (const field of ['name', 'description']) {
      assert.ok(s[field], `${s.id} is missing ${field}`);
    }
    for (const field of ['expertise', 'keywords']) {
      assert.ok(Array.isArray(s[field]) && s[field].length > 0, `${s.id} has no ${field}`);
    }
  }
});

test('alg-ask routing picks the expected specialist for natural questions', () => {
  const cases = {
    'How do I create a release?': 'Riley',
    'I get an error in my build': 'Rex',
    'compile errors in my build': 'Rex',
    'build artifacts are missing': 'Bruno',
    'Set up a codespace for development': 'Freddy',
    'My pull request build fails': 'Blake',
    'How do I bump the version number?': 'Vera',
    'test against the next major version of BC': 'Finn',
    'publish my app to a sandbox environment': 'Ethan',
    'create a new app': 'Grace',
    'performance tests': 'Perry',
    'update AL-Go system files': 'Stella',
    'generate reference documentation': 'Drew',
    'ask riley about hotfixes': 'Riley'
  };
  for (const [question, expected] of Object.entries(cases)) {
    assert.equal(svc.route(question)[0]?.item.persona, expected, question);
  }
});

test('routing returns nothing for unrelated questions', () => {
  assert.deepEqual(svc.route('what is the weather'), []);
});

test('getByPersona accepts names and handles', () => {
  for (const handle of ['freddy', 'Freddy', 'alg-freddy', '@alg-freddy']) {
    assert.equal(svc.getByPersona(handle)?.id, 'alg-freddy', handle);
  }
  assert.equal(svc.getByPersona('nobody'), undefined);
});
