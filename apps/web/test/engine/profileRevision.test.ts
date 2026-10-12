import { expect, it } from 'vitest';
import {
  type BiologicalSex,
  CalendarDate,
  type GoalMode,
  Profile,
  ScreeningAnswers,
  UserSetup,
} from '../../src/domain';
import {
  analyze,
  type CoachSnapshot,
  currentTargetRulesVersion,
  DailyTargets,
  nextTargets,
  type TargetFlag,
  TargetsRecord,
} from '../../src/engine';
import { upTo } from '../support/upTo';

/** MM-83: a corrected profile or health check issues new targets at once. */
const start = CalendarDate.of(2026, 1, 1);

const setup = ({
  sex = 'male',
  screening = new ScreeningAnswers(),
  revision = 0,
  mode = 'fatLoss',
}: { sex?: BiologicalSex; screening?: ScreeningAnswers; revision?: number; mode?: GoalMode } = {}) =>
  new UserSetup({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening,
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn: start,
    profileRevision: revision,
  });

const snapshotFor = (s: UserSetup) =>
  analyze({
    setup: s,
    weights: upTo(30).map((d) => ({ date: start.addDays(d), weightKg: 80 })),
    intake: [],
    today: start.addDays(30),
  }) as CoachSnapshot;

const last = ({
  revision,
  mode = 'fatLoss',
  rulesVersion = currentTargetRulesVersion,
}: {
  revision: number;
  mode?: GoalMode;
  rulesVersion?: number;
}) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(29),
    mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    profileRevision: revision,
    targetRulesVersion: rulesVersion,
    safetyBodyFatPercent: 15,
    targets: new DailyTargets({ kcal: 2200, proteinG: 170, fatG: 70, carbsG: 230, weeklyRateFraction: -0.0075 }),
  });

it('a new revision issues targets the next day, with no step limit', () => {
  const s = setup({ sex: 'female', revision: 1 });
  const next = nextTargets({
    setup: s,
    snapshot: snapshotFor(s),
    history: [last({ revision: 0 })],
    today: start.addDays(30),
  });
  expect(next, 'the weekly wait does not apply').toBeDefined();
  expect(next?.profileRevision).toBe(1);
  expect(next?.effectiveFrom).toBe(start.addDays(30));
  expect(next?.targets.flags).not.toContain('rateLimited');
});

it('the same revision changes nothing before the check-in is due', () => {
  const s = setup({ revision: 2 });
  expect(
    nextTargets({ setup: s, snapshot: snapshotFor(s), history: [last({ revision: 2 })], today: start.addDays(30) }),
  ).toBeUndefined();
});

it('a target-rules update applies before the next weekly check-in', () => {
  const s = setup();
  const next = nextTargets({
    setup: s,
    snapshot: snapshotFor(s),
    history: [last({ revision: 0, rulesVersion: currentTargetRulesVersion - 1 })],
    today: start.addDays(30),
  });
  expect(next).toBeDefined();
  expect(next?.targetRulesVersion).toBe(currentTargetRulesVersion);
  expect(next?.explanation?.lines.map((line) => line.reason)).toContain('appRuleUpdate');
});

it('the current target-rules version waits for the normal check-in', () => {
  const s = setup();
  const next = nextTargets({
    setup: s,
    snapshot: snapshotFor(s),
    history: [last({ revision: 0 })],
    today: start.addDays(30),
  });
  expect(next).toBeUndefined();
});

it('a health answer that rules the goal out makes it maintenance, flagged', () => {
  const s = setup({ sex: 'female', screening: new ScreeningAnswers({ pregnant: true }), revision: 1 });
  const next = nextTargets({
    setup: s,
    snapshot: snapshotFor(s),
    history: [last({ revision: 0 })],
    today: start.addDays(30),
  });
  expect(next?.mode).toBe('maintenance');
  expect(next?.targets.weeklyRateFraction).toBe(0);
  expect(next?.targets.flags).toContain('modeNotAllowed');
});

it('once held at maintenance for a health answer, it is not rewritten while the stored goal is still the old one', () => {
  const s = setup({ sex: 'female', screening: new ScreeningAnswers({ pregnant: true }), revision: 1 });
  const held = new TargetsRecord({
    effectiveFrom: start.addDays(30),
    mode: 'maintenance',
    tdeeKcal: 2300,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    profileRevision: 1,
    safetyBodyFatPercent: 15,
    targets: new DailyTargets({
      kcal: 2300,
      proteinG: 120,
      fatG: 70,
      carbsG: 260,
      weeklyRateFraction: 0,
      flags: new Set<TargetFlag>(['modeNotAllowed']),
    }),
  });
  expect(
    nextTargets({ setup: s, snapshot: snapshotFor(s), history: [held], today: start.addDays(31) }),
  ).toBeUndefined();
});
