import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachAdviceGiven } from '../../src/engine/analysis/accountability/CoachAdviceGiven';
import type { CoachAdviceRecordRepository } from '../../src/engine/analysis/accountability/CoachAdviceRecordRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `CoachAdviceRecordRepository` must do (MM-617), in memory and in the database. */
export function coachAdviceRecordRepositoryContract(
  name: string,
  create: () => CoachAdviceRecordRepository | Promise<CoachAdviceRecordRepository>,
): void {
  describe(`${name} as a CoachAdviceRecordRepository`, () => {
    let repo: CoachAdviceRecordRepository;
    const tuesday = CalendarDate.of(2026, 10, 20);
    const thursday = CalendarDate.of(2026, 10, 22);
    const given = (over: Partial<CoachAdviceGiven> = {}): CoachAdviceGiven => ({
      foodKey: "general tso's chicken",
      foodName: "General Tso's chicken",
      kind: 'skip',
      replacementName: undefined,
      kcal: 744,
      on: tuesday,
      ...over,
    });
    const swap = given({ kind: 'swap', replacementName: 'generalTso', kcal: 744.5 });
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchAdviceGivenSince(tuesday.addDays(-100)))).toEqual([]);
    });

    it('keeps every field of what is recorded, a replacement too', async () => {
      const halve = given({ foodKey: 'cookie butter', foodName: 'Cookie butter', kind: 'halve', kcal: 170, on: thursday });
      const taken = given({ foodKey: 'biscuit', foodName: 'Biscuit', kind: 'taken', kcal: 1400, on: thursday });
      await repo.recordAdviceGiven([given(), swap, halve, taken]);
      expect(await first(repo.watchAdviceGivenSince(tuesday))).toEqual([given(), swap, halve, taken]);
    });

    it('keeps one for each food key, kind and day: the first recorded', async () => {
      await repo.recordAdviceGiven([given()]);
      await repo.recordAdviceGiven([given({ kcal: 800, foodName: "General Tso's" })]);
      await repo.recordAdviceGiven([given(), given()]);
      expect(await first(repo.watchAdviceGivenSince(tuesday))).toEqual([given()]);
    });

    it('another kind, food or day is another entry', async () => {
      await repo.recordAdviceGiven([given(), swap, given({ foodKey: 'egg rolls', foodName: 'Egg rolls' }), given({ on: thursday })]);
      const record = await first(repo.watchAdviceGivenSince(tuesday));
      expect(record.map((g) => [g.foodKey, g.kind, g.on.toString()])).toEqual([
        ["general tso's chicken", 'skip', '2026-10-20'],
        ["general tso's chicken", 'swap', '2026-10-20'],
        ['egg rolls', 'skip', '2026-10-20'],
        ["general tso's chicken", 'skip', '2026-10-22'],
      ]);
    });

    it('lists oldest first, entries of one day in the order recorded, from the day asked', async () => {
      await repo.recordAdviceGiven([given({ foodKey: 'b', on: thursday })]);
      await repo.recordAdviceGiven([given({ foodKey: 'c', on: tuesday }), given({ foodKey: 'a', on: tuesday })]);
      await repo.recordAdviceGiven([given({ foodKey: 'd', on: tuesday.addDays(-1) })]);
      expect((await first(repo.watchAdviceGivenSince(tuesday.addDays(-1)))).map((g) => g.foodKey)).toEqual(['d', 'c', 'a', 'b']);
      expect((await first(repo.watchAdviceGivenSince(tuesday))).map((g) => g.foodKey)).toEqual(['c', 'a', 'b']);
      expect((await first(repo.watchAdviceGivenSince(thursday.addDays(1))))).toEqual([]);
    });

    it('recording nothing leaves the record as it was', async () => {
      await repo.recordAdviceGiven([given()]);
      await repo.recordAdviceGiven([]);
      expect(await first(repo.watchAdviceGivenSince(tuesday))).toHaveLength(1);
    });

    it('emits the current record first, then each change', async () => {
      await expectChangeEmits(repo.watchAdviceGivenSince(tuesday), {
        before: [],
        change: () => repo.recordAdviceGiven([given()]),
        after: [given()],
      });
    });
  });
}
