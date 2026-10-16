import { expect, it } from 'vitest';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { suggestedWaterGoalMl } from '../../src/domain/water/suggestedWaterGoalMl';
import type { WaterSuggestionInput } from '../../src/domain/water/WaterSuggestionInput';
import { WaterUnits } from '../../src/domain/water/WaterUnits';

const flOz = (input: Partial<WaterSuggestionInput>) => {
  const ml = suggestedWaterGoalMl({
    sex: 'male',
    weightKg: 90,
    proteinTargetG: 180,
    trainingDaysPerWeek: 4,
    screening: new ScreeningAnswers(),
    units: 'imperial',
    ...input,
  });
  return ml === undefined ? undefined : Math.round(WaterUnits.mlToFlOz(ml));
};

/** MM-358: the suggested water goal, as the owner chose the panel's formula. */
it('a training man on a high-protein target is suggested 104 fl oz', () => {
  expect(flOz({})).toBe(104);
});

it('a woman on recomposition is suggested 80 fl oz', () => {
  expect(flOz({ sex: 'female', weightKg: 65, proteinTargetG: 130, trainingDaysPerWeek: 3 })).toBe(80);
});

it('pregnancy and breastfeeding have their own amounts, whatever the protein and training', () => {
  expect(flOz({ sex: 'female', screening: new ScreeningAnswers({ pregnant: true }) })).toBe(56);
  expect(flOz({ sex: 'female', screening: new ScreeningAnswers({ breastfeeding: true }) })).toBe(64);
});

it('without a weight or a protein target the protein term is left out', () => {
  expect(flOz({ weightKg: undefined, trainingDaysPerWeek: 0 })).toBe(64);
  expect(flOz({ proteinTargetG: undefined, trainingDaysPerWeek: 0 })).toBe(64);
});

it('never above 120 fl oz, or 3.5 L in metric', () => {
  expect(flOz({ weightKg: 150, proteinTargetG: 400, trainingDaysPerWeek: 7 })).toBe(120);
  expect(suggestedWaterGoalMl({ sex: 'male', weightKg: 150, proteinTargetG: 400, trainingDaysPerWeek: 7, screening: new ScreeningAnswers(), units: 'metric' })).toBe(3_500);
});

it('in metric it is rounded to 250 mL', () => {
  expect(suggestedWaterGoalMl({ sex: 'male', weightKg: 90, proteinTargetG: 180, trainingDaysPerWeek: 4, screening: new ScreeningAnswers(), units: 'metric' })).toBe(3_000);
});

for (const answer of ['chronicKidneyDisease', 'bariatricSurgery', 'fluidLimitedByClinician'] as const) {
  it(`withheld where a care team sets what is drunk: ${answer}`, () => {
    expect(flOz({ screening: new ScreeningAnswers({ [answer]: true }) })).toBeUndefined();
  });
}
