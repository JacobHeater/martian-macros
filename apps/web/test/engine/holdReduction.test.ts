import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import {
  canHoldReduction,
  DailyTargets,
  ExplanationLine,
  type ExplanationReason,
  holdReduction,
  type TargetFlag,
  TargetsExplanation,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';

/**
 * MM-138: the user may keep last week's targets, once, for an ordinary
 * reduction.
 */
const start = CalendarDate.of(2026, 1, 1);

const record = (
  week: number,
  kcal: number,
  {
    flags = [],
    lines,
    previousKcal,
  }: { flags?: readonly TargetFlag[]; lines?: readonly ExplanationLine[]; previousKcal?: number } = {},
) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(7 * week),
    mode: 'fatLoss',
    tdeeKcal: 2800,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    targets: new DailyTargets({
      kcal,
      proteinG: 170,
      proteinMinimumG: 128,
      fatG: 70,
      carbsG: 240,
      weeklyRateFraction: -0.0075,
      flags: new Set(flags),
    }),
    explanation:
      lines === undefined
        ? undefined
        : new TargetsExplanation({ lines, previousKcal, newKcal: kcal, estimateStatus: 'updated' }),
  });

const ordinary = [new ExplanationLine('expenditureEstimate', -75, { from: 2900, to: 2825 })];

const reduction = () => [record(0, 2400), record(1, 2325, { lines: ordinary, previousKcal: 2400 })];

it('an ordinary reduction can be held', () => {
  expect(canHoldReduction(reduction())).toBe(true);
});

it("holding returns last week's numbers on the same day, flagged, and the lines still add up", () => {
  const h = reduction();
  const first = h[0] as TargetsRecord;
  const latest = h[1] as TargetsRecord;
  const held = holdReduction(h);
  expect(held.effectiveFrom).toBe(latest.effectiveFrom);
  expect(held.targets.kcal).toBe(2400);
  expect(held.targets.proteinG).toBe(first.targets.proteinG);
  expect(held.targets.proteinMinimumG).toBe(first.targets.proteinMinimumG);
  expect(held.targets.flags).toEqual(new Set(['heldByUser']));
  const e = held.explanation as TargetsExplanation;
  expect(e.change).toBe(0);
  expectClose(e.linesTotal, 0, 1e-9);
  const lastLine = e.lines[e.lines.length - 1];
  expect(lastLine?.reason).toBe('userHold');
  expect(lastLine?.kcal).toBe(75);
});

it('not twice running: the week after a hold offers no hold', () => {
  const held = holdReduction(reduction());
  const next = record(2, 2250, {
    lines: [new ExplanationLine('expenditureEstimate', -75, { from: 2825, to: 2750 })],
    previousKcal: 2400,
  });
  expect(canHoldReduction([record(0, 2400), held, next])).toBe(false);
});

it('it can be offered again two check-ins later', () => {
  const held = holdReduction(reduction());
  const next = record(2, 2300, { lines: ordinary, previousKcal: 2400 });
  const later = record(3, 2225, { lines: ordinary, previousKcal: 2300 });
  expect(canHoldReduction([record(0, 2400), held, next, later])).toBe(true);
});

it('never for an increase', () => {
  const history = [
    record(0, 2325),
    record(1, 2400, { lines: [new ExplanationLine('expenditureEstimate', 75)], previousKcal: 2325 }),
  ];
  expect(canHoldReduction(history)).toBe(false);
});

it('never for a safety change', () => {
  const flags: TargetFlag[] = [
    'raisedForSafePace',
    'heldAfterSafetyRaise',
    'underweightMaintenance',
    'modeNotAllowed',
    'dietBreak',
  ];
  for (const flag of flags) {
    const history = [record(0, 2400), record(1, 2325, { flags: [flag], lines: ordinary, previousKcal: 2400 })];
    expect(canHoldReduction(history), flag).toBe(false);
  }
});

it('never for a change the user made, or one with a safety cause', () => {
  const reasons: ExplanationReason[] = [
    'goalChange',
    'profileCorrection',
    'healthRule',
    'underweightRule',
    'bodyFatEstimate',
    'dietBreak',
    'safetyRaise',
    'calorieFloor',
  ];
  for (const reason of reasons) {
    const history = [
      record(0, 2400),
      record(1, 2325, { lines: [new ExplanationLine(reason, -75)], previousKcal: 2400 }),
    ];
    expect(canHoldReduction(history), reason).toBe(false);
  }
});

it('not without an explanation, and not for the first targets', () => {
  expect(canHoldReduction([record(0, 2400), record(1, 2325)])).toBe(false);
  expect(canHoldReduction([record(0, 2400)])).toBe(false);
  expect(canHoldReduction([])).toBe(false);
});

// Not in the Dart tests: Dart checked this with an assert, which is off in
// a release build. Here it is always refused.
it('holding what cannot be held is refused', () => {
  expect(() => holdReduction([record(0, 2400)])).toThrow();
});
