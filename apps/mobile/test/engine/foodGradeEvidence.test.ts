import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';
import { FoodGradeRule } from '../../src/engine/FoodGradeRule';

/** MM-369, MM-370: the food grade and every figure it turns on has a row in the evidence register (MM-143). */
it('the food grade and its figures have evidence rows', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  const registered = new Set(register.rows.map((row) => row.name));
  const expected = [
    'foodGrade',
    'foodGrade.fvlOmitted',
    'foodGrade.oneTableForAll',
    'foodGrade.requiredNutrients',
    ...Object.keys(FoodGradeRule).map((name) => `FoodGradeRule.${name}`),
  ];
  expect(expected.filter((name) => !registered.has(name)), 'Add an evidence row for each.').toEqual([]);
  const question = register.questions.find((q) => q.title === 'How is a food graded?');
  expect(question, 'The register answers "How is a food graded?"').toBeDefined();
  expect(question?.rowNames).toContain('foodGrade');
});
