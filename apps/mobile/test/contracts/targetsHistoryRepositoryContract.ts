import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { ExplanationLine } from '../../src/engine/ExplanationLine';
import { TargetFlag } from '../../src/engine/TargetFlag';
import { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import type { TargetsHistoryRepository } from '../../src/engine/TargetsHistoryRepository';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { single } from '../support/single';

const record = (
  from: CalendarDate,
  kcal: number,
  {
    flags,
    safetyBodyFatPercent,
    profileRevision = 0,
    explanation,
    requestedLossFraction,
  }: {
    flags?: ReadonlySet<TargetFlag>;
    safetyBodyFatPercent?: number;
    profileRevision?: number;
    explanation?: TargetsExplanation;
    requestedLossFraction?: number;
  } = {},
) =>
  new TargetsRecord({
    effectiveFrom: from,
    mode: 'fatLoss',
    tdeeKcal: 2600,
    tdeeSigmaKcal: 300,
    tdeeStatus: 'held',
    safetyBodyFatPercent,
    profileRevision,
    explanation,
    requestedLossFraction,
    targets: new DailyTargets({
      kcal,
      proteinG: 160,
      fatG: 70,
      carbsG: 200,
      weeklyRateFraction: -0.0075,
      flags: flags ?? new Set(),
    }),
  });

/** What every `TargetsHistoryRepository` must do. */
export function targetsHistoryRepositoryContract(
  name: string,
  create: () => TargetsHistoryRepository | Promise<TargetsHistoryRepository>,
): void {
  describe(`${name} as a TargetsHistoryRepository`, () => {
    let repo: TargetsHistoryRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 8);
    beforeEach(async () => {
      repo = await create();
    });

    it('keeps the body-fat figure the safety rules used, or none', async () => {
      await repo.saveTargets(record(d1, 2200, { safetyBodyFatPercent: 14.63 }));
      await repo.saveTargets(record(d2, 2300));
      const history = await first(repo.watchTargetsHistory());
      expectClose(history[0]?.safetyBodyFatPercent, 14.63, 1e-9);
      expect(history[1]?.safetyBodyFatPercent).toBeUndefined();
    });

    it('keeps the profile revision the targets were made for', async () => {
      await repo.saveTargets(record(d1, 2200, { profileRevision: 2 }));
      await repo.saveTargets(record(d2, 2300));
      const history = await first(repo.watchTargetsHistory());
      expect(history[0]?.profileRevision).toBe(2);
      expect(history[1]?.profileRevision).toBe(0);
    });

    it('keeps why the targets were issued, or none', async () => {
      const why = new TargetsExplanation({
        lines: [
          new ExplanationLine('expenditureEstimate', -90, { from: 2950, to: 2860 }),
          new ExplanationLine('stepLimit', 15),
        ],
        previousKcal: 2400,
        newKcal: 2325,
        estimateStatus: 'updated',
        usableIntakeDays: 12,
        excludedPartialDays: 2,
        weighIns: 11,
      });
      await repo.saveTargets(record(d1, 2325, { explanation: why }));
      await repo.saveTargets(record(d2, 2300));
      const history = await first(repo.watchTargetsHistory());
      const back = history[0]?.explanation;
      expect(back?.newKcal).toBe(2325);
      expect(back?.previousKcal).toBe(2400);
      expect(back?.weighIns).toBe(11);
      expect(back?.lines.map((l) => [l.reason, l.kcal, l.from, l.to])).toEqual(
        why.lines.map((l) => [l.reason, l.kcal, l.from, l.to]),
      );
      expect(history[1]?.explanation).toBeUndefined();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchTargetsHistory())).toEqual([]);
    });

    it('lists records oldest first', async () => {
      await repo.saveTargets(record(d2, 2000));
      await repo.saveTargets(record(d1, 2100));
      expect((await first(repo.watchTargetsHistory())).map((r) => r.targets.kcal)).toEqual([2100, 2000]);
    });

    it('a record for the same day replaces the earlier one', async () => {
      await repo.saveTargets(record(d1, 2100));
      await repo.saveTargets(record(d1, 1900));
      expect(single(await first(repo.watchTargetsHistory())).targets.kcal).toBe(1900);
    });

    it('marks summaries through a day without removing their explanations', async () => {
      const why = new TargetsExplanation({
        lines: [new ExplanationLine('stepLimit', -25)],
        previousKcal: 2200,
        newKcal: 2175,
        estimateStatus: 'updated',
      });
      await repo.saveTargets(record(d1, 2175, { explanation: why }).copyWith({ summarySeen: false }));
      await repo.saveTargets(record(d2, 2150, { explanation: why }).copyWith({ summarySeen: false }));
      await repo.markSummariesSeenThrough(d1);
      const history = await first(repo.watchTargetsHistory());
      expect(history[0]?.summarySeen).toBe(true);
      expect(history[0]?.explanation?.lines.length).toBe(1);
      expect(history[1]?.summarySeen).toBe(false);
    });

    it('keeps the estimate and the flags', async () => {
      const firstFlag = TargetFlag.values[0];
      const lastFlag = TargetFlag.values[TargetFlag.values.length - 1] as TargetFlag;
      await repo.saveTargets(record(d1, 2000, { flags: new Set([firstFlag, lastFlag]) }));
      const r = single(await first(repo.watchTargetsHistory()));
      expect(r.tdeeKcal).toBe(2600);
      expect(r.tdeeSigmaKcal).toBe(300);
      expect(r.tdeeStatus).toBe('held');
      expect(r.mode).toBe('fatLoss');
      expect(r.targets.flags).toEqual(new Set([firstFlag, lastFlag]));
    });

    // MM-128: the pace a record of targets was asked for; undefined for the default, or on older records.
    it('keeps the pace the targets were asked for', async () => {
      await repo.saveTargets(record(d1, 2200));
      await repo.saveTargets(record(d2, 2300, { requestedLossFraction: 0.005 }));
      const history = await first(repo.watchTargetsHistory());
      expect(history[0]?.requestedLossFraction).toBeUndefined();
      expect(history[1]?.requestedLossFraction).toBe(0.005);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchTargetsHistory(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveTargets(record(d1, 2000)),
        after: 1,
      });
    });
  });
}
