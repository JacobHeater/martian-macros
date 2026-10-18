import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';
import { FoodGradeRule } from '../../src/engine/FoodGradeRule';

/** MM-380, MM-382: the food grade and every figure it turns on has a row in the evidence register (MM-143). */
it('the food grade and its figures have evidence rows', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  const registered = new Set(register.rows.map((row) => row.name));
  const expected = [
    'foodGrade',
    'foodGrade.requiredNutrients',
    'foodGrade.refinementsWhenStated',
    ...Object.keys(FoodGradeRule).map((name) => `FoodGradeRule.${name}`),
  ];
  expect(expected.filter((name) => !registered.has(name)), 'Add an evidence row for each.').toEqual([]);
  const question = register.questions.find((q) => q.title === 'How is a food graded?');
  expect(question, 'The register answers "How is a food graded?"').toBeDefined();
  expect(question?.rowNames).toContain('foodGrade');
  expect(question?.rowNames).toEqual(expect.arrayContaining(expected));
});

it('no published model is named as the method’s basis', () => {
  const register = readFileSync('../../docs/evidence.md', 'utf8');
  const question = register.slice(register.indexOf('### How is a food graded?'), register.indexOf('## Register'));
  expect(question).not.toMatch(/Nutri-?Score|Health Star|nutrient profiling model/i);
  for (const row of register.split('\n').filter((line) => line.startsWith('| `foodGrade') || line.startsWith('| `FoodGradeRule'))) {
    expect(row, row).not.toMatch(/Nutri-?Score|Health Star/i);
  }
});
