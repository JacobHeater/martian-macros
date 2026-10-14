import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';

/**
 * MM-143: every value that tunes safety or the model has a row in the
 * evidence register. The names are read out of the source, so a constant
 * added without a row fails here.
 */
function names(path: string, prefix: string, declaration: RegExp): string[] {
  const source = readFileSync(path, 'utf8');
  return [...source.matchAll(declaration)].map((match) => `${prefix}${match[1] as string}`);
}

/** A number given as a default in a constructor: `this.x = init.x ?? 0.5;`. */
const constructorDefault = /this\.(\w+) = init\.\w+ \?\? -?\d+(?:\.\d+)?;/g;

it('the evidence register covers safety and model tuning values', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));

  // The limits of SafetyBounds are top-level numbers in its file.
  const safety = names('src/engine/SafetyBounds.ts', 'SafetyBounds.', /^const (\w+) = \d+(?:\.\d+)?;/gm);
  const partition = names('src/engine/partitionConstants.ts', '', /^export const (\w+) = \d+(?:\.\d+)?;/gm);
  const trend = names('src/engine/WeightTrendModel.ts', 'WeightTrendModel.', constructorDefault);
  const estimator = names('src/engine/TdeeEstimator.ts', 'TdeeEstimator.', constructorDefault);
  // The sodium limit and the water goal (MM-311, MM-313).
  const goals = names('src/domain/NutritionGoals.ts', 'NutritionGoals.', /static readonly (\w+) = [\d_]+;/g);

  // If a pattern stopped matching, the test would pass while checking
  // nothing: these are the numbers of values each file has today.
  expect(safety).toHaveLength(5);
  expect(partition).toHaveLength(3);
  expect(trend).toHaveLength(8);
  expect(estimator).toHaveLength(9);
  expect(goals).toHaveLength(7);

  const expected = [...safety, ...partition, ...trend, ...estimator, ...goals];
  const registeredNames = new Set(register.rows.map((row) => row.name));
  const missing = expected.filter((name) => !registeredNames.has(name));
  expect(missing, 'Add an evidence row for each public tuning value.').toEqual([]);
  expect(registeredNames.size, 'Register rows must have unique names.').toBe(register.rows.length);

  for (const row of register.rows) {
    expect(row.value, row.name).not.toBe('');
    expect(row.where, row.name).not.toBe('');
    expect(row.decides, row.name).not.toBe('');
    expect(row.source, row.name).not.toBe('');
    expect(row.population, row.name).not.toBe('');
  }

  for (const question of register.questions) {
    expect(question.answer, question.title).not.toBe('');
    for (const name of question.rowNames) {
      expect(registeredNames, `"${question.title}" references an unknown evidence row.`).toContain(name);
    }
  }
});
