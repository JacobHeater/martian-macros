import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPlan } from '../src/checkPlan.ts';

const names = (args: string[]) => {
  const plan = checkPlan(args);
  if (typeof plan === 'string') throw new Error(plan);
  return plan.steps.map((s) => s.name);
};

/** MM-619: a person's `mm check` runs everything in order; CI runs one part a job. */
test('mm check runs every step in order, as before', () => {
  assert.deepEqual(names([]), ['req', 'panel', 'tool', 'typecheck', 'tests', 'stories', 'build', 'offline', 'legal']);
});

test('each part runs its own steps, and together the parts are the whole', () => {
  assert.deepEqual(names(['--part', 'static']), ['req', 'panel', 'tool', 'typecheck', 'build', 'offline', 'legal']);
  assert.deepEqual(names(['--part', 'tests']), ['tests']);
  assert.deepEqual(names(['--part', 'stories']), ['stories']);
  const whole = new Set([...names(['--part', 'static']), ...names(['--part', 'tests']), ...names(['--part', 'stories'])]);
  assert.deepEqual([...whole].sort(), names([]).sort());
});

test('the tests run rules and screens, never the stories, and a shard is passed on', () => {
  const plan = checkPlan(['--part', 'tests', '--shard', '2/3']);
  assert.notEqual(typeof plan, 'string');
  if (typeof plan === 'string') return;
  assert.deepEqual(plan.steps[0]?.web, ['npx', 'vitest', 'run', '--project', 'rules', '--project', 'screens', '--project', 'screens-css', '--shard=2/3']);
});

test('a wrong part or shard is refused with what to say', () => {
  assert.equal(typeof checkPlan(['--part', 'everything']), 'string');
  assert.equal(typeof checkPlan(['--part', 'tests', '--shard', '4/3']), 'string');
  assert.equal(typeof checkPlan(['--part', 'tests', '--shard', 'two']), 'string');
  assert.equal(typeof checkPlan(['--shard', '1/2']), 'string');
});
