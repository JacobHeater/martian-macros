import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handoffProblems, handoffSessionLimit } from '../src/requirements.ts';

/** MM-174: the handoff document stays a short, rolling summary. */
const doc = (sessions: number): string[] => [
  '# Handoff',
  '',
  '## Where things stand',
  'Something.',
  ...Array.from({ length: sessions }, (_, i) => [`## Session ${i}`, 'What changed.']).flat(),
];

test('one to three sessions is fine', () => {
  for (let sessions = 1; sessions <= handoffSessionLimit; sessions++) {
    assert.deepEqual(handoffProblems(doc(sessions)), []);
  }
});

test('a fourth session must push the oldest out', () => {
  const problems = handoffProblems(doc(4));
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /drop the oldest/);
});

test('a document with no session says nothing useful', () => {
  const problems = handoffProblems(doc(0));
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /at least one/);
});

test('other headings are not counted as sessions', () => {
  assert.deepEqual(handoffProblems([...doc(3), '## Open decisions', '### Session notes']), []);
});
