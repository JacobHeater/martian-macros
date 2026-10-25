import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { EvidenceRegister } from '../../src/domain';
import { CoachFollowUpRule } from '../../src/engine/analysis/accountability/CoachFollowUpRule';
import { FoodSignalId } from '../../src/engine/analysis/food/FoodSignalId';
import { FoodSignalRule } from '../../src/engine/analysis/food/FoodSignalRule';
import { CoachAdviceRule } from '../../src/engine/analysis/CoachAdviceRule';
import { TradeRule } from '../../src/engine/analysis/TradeRule';
import { TrainingAnalysisRule } from '../../src/engine/analysis/TrainingAnalysisRule';
import { TrainingFindingSignal } from '../../src/engine/analysis/TrainingFindingSignal';
import { TrendRule } from '../../src/engine/trends/TrendRule';

/**
 * MM-143 for the coach's analysis (MM-604): the trend engine (MM-605), the
 * food signals (MM-606), the trades (MM-607), the training, water and
 * sleep signals (MM-609), the single day (MM-612) and the coach's
 * accountability (MM-617). Every signal and
 * every figure it turns on has a row in the evidence register, so a
 * threshold added without one fails here.
 */
it('every coach analysis signal and its figures have an evidence row', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  const registered = new Set(register.rows.map((row) => row.name));
  // Bookkeeping and identifiers, not figures about anyone: the rules version and the signal ids a trade checks.
  const notFigures = new Set(['TrendRule.rulesVersion', 'TradeRule.sodiumSignal', 'TradeRule.fiberSignal']);
  const expected = [
    ...Object.keys(TrendRule).map((name) => `TrendRule.${name}`),
    'TrendTier',
    'coachFindingWords',
    'foodTrendSignals',
    ...FoodSignalId.values.map((id) => `foodSignal.${id}`),
    'topContributors',
    'analyseFoodDay',
    'foodsThatFit',
    'findTrade',
    ...Object.keys(FoodSignalRule).map((name) => `FoodSignalRule.${name}`),
    ...Object.keys(TradeRule).map((name) => `TradeRule.${name}`),
    ...TrainingFindingSignal.values.map((id) => `trainingSignal.${id}`),
    ...Object.keys(TrainingAnalysisRule).map((name) => `TrainingAnalysisRule.${name}`),
    // The coach's accountability (MM-617).
    ...Object.keys(CoachFollowUpRule).map((name) => `CoachFollowUpRule.${name}`),
  ].filter((name) => !notFigures.has(name));
  expect(Object.keys(FoodSignalRule).length).toBeGreaterThan(0);
  expect(Object.keys(CoachAdviceRule).length).toBeGreaterThan(0);
  expect(expected.filter((name) => !registered.has(name)), 'Add an evidence row for each.').toEqual([]);
  const question = register.questions.find((q) => q.title === 'What does the coach read in my data?');
  expect(question, 'The register answers "What does the coach read in my data?"').toBeDefined();
});

it('the protein rows cite the Dietary Guidelines 2025–2030 as concordant, from a secondary summary (NU-A6)', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  for (const name of ['SafetyBounds.proteinRangeG', 'SafetyBounds.proteinTargetsG']) {
    expect(register.row(name)?.source, name).toMatch(/Dietary Guidelines for Americans 2025–2030.*1\.2 to 1\.6 g per kg.*Am Fam Physician 2026/);
  }
});

it("every CoachAdviceRule figure has its own row, a judgement unless a source is cited (MM-617)", () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  for (const name of Object.keys(CoachAdviceRule)) {
    const row = register.row(`CoachAdviceRule.${name}`);
    expect(row, name).toBeDefined();
    expect(row?.where, name).toContain('CoachAdviceRule.ts');
  }
  expect(register.row('CoachAdviceRule.sleepMinutes')?.source).toMatch(/Watson/);
});
