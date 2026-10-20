import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CalendarDate, Profile } from '../../src/domain';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';
import type { WeekResult } from './support/WeekResult';

/**
 * MM-230: the simulated coaching loop gives what the Dart engine gave.
 *
 * `support/dartCoachLoop.json` was printed by the Dart VM from the Dart
 * engine and the Dart simulator for the four runs below: for each week, the
 * targets issued, the expenditure estimate, the simulated person's true
 * weight and the flags. A run is weeks of weigh-ins and food logs fed
 * through the trend, the estimator, the safety rules and the target
 * calculation, each week's result feeding the next, so any difference in
 * the port compounds and shows.
 *
 * The comparison allows one part in a billion. The simulator draws its
 * noise through a logarithm and a cosine, which Dart and JavaScript may
 * round differently in the last digit; everything else is exact.
 */
type Week = readonly [
  kcal: number,
  proteinG: number,
  fatG: number,
  carbsG: number,
  tdeeKcal: number,
  tdeeSigmaKcal: number,
  trueWeightKg: number,
  flags: string,
];

const fromDart = JSON.parse(readFileSync('test/engine/support/dartCoachLoop.json', 'utf8')) as Record<
  string,
  readonly Week[]
>;

const male = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
const female = new Profile({ sex: 'female', birthDate: CalendarDate.of(1988, 7, 9), heightCm: 165 });

const runs: Record<string, () => WeekResult[]> = {
  sloppy21: () =>
    runCoachLoop({
      user: new SyntheticUser({
        seed: 21,
        baseTdeeKcal: 3000,
        startWeightKg: 92,
        bodyFatPercent: 26,
        underReportFraction: 0.2,
        partialLogProbability: 0.1,
        skipLogProbability: 0.1,
      }),
      profile: male,
      mode: 'fatLoss',
      weeks: 16,
    }),
  recomp41: () =>
    runCoachLoop({
      user: new SyntheticUser({ seed: 41, baseTdeeKcal: 2600, startWeightKg: 80, bodyFatPercent: 18 }),
      profile: male,
      mode: 'recomp',
      weeks: 10,
      trainingStatus: 'novice',
    }),
  glycogen7: () =>
    runCoachLoop({
      user: new SyntheticUser({
        seed: 7,
        baseTdeeKcal: 2300,
        startWeightKg: 70,
        bodyFatPercent: 30,
        glycogenSwingFraction: 0.015,
        weighedShare: 0.5,
      }),
      profile: female,
      mode: 'fatLoss',
      weeks: 20,
      trainingDaysPerWeek: 4,
      dailyActivity: 'onFeet',
    }),
  gain5: () =>
    runCoachLoop({
      user: new SyntheticUser({ seed: 5, baseTdeeKcal: 2900, startWeightKg: 72, bodyFatPercent: 12 }),
      profile: male,
      mode: 'leanGain',
      weeks: 12,
    }),
};

for (const [name, run] of Object.entries(runs)) {
  it(`the ${name} run matches the Dart engine week by week`, () => {
    const expected = fromDart[name];
    expect(expected, name).toBeDefined();
    const results = run();
    expect(results).toHaveLength(expected?.length ?? -1);
    // MM-135 (2026-10-20): the break the Dart engine forced at sixteen weeks
    // is now planned at twenty, so the glycogen7 run's weeks 16 to 19 (Dart's
    // break and its step-limited return) are no longer what the engine does.
    // The sixteen weeks before it are compared; `dietBreakLoop.test.ts` has
    // the new behaviour.
    const compared = name === 'glycogen7' ? 16 : results.length;
    let worst = 0;
    results.slice(0, compared).forEach((week, i) => {
      const dart = expected?.[i] as Week;
      const mine = [
        week.targets.kcal,
        week.targets.proteinG,
        week.targets.fatG,
        week.targets.carbsG,
        week.tdee.kcal,
        week.tdee.sigmaKcal,
        week.trueWeightKg,
      ];
      mine.forEach((value, column) => {
        const reference = dart[column] as number;
        const relative = Math.abs(value - reference) / Math.max(1, Math.abs(reference));
        worst = Math.max(worst, relative);
        expect(relative, `${name} week ${i} column ${column}: ${value} against ${reference}`).toBeLessThan(1e-9);
      });
      expect([...week.targets.flags].join('+'), `${name} week ${i} flags`).toBe(dart[7]);
    });
    // Printed so a run shows how close the two are, not only that they pass.
    console.info(`${name}: largest relative difference ${worst.toExponential(2)}`);
  });
}
