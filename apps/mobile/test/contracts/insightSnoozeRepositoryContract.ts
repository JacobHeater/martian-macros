import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { InsightSnooze } from '../../src/engine/InsightSnooze';
import type { InsightSnoozeRepository } from '../../src/engine/InsightSnoozeRepository';
import { first } from '../support/first';

/** What every `InsightSnoozeRepository` must do (MM-378). */
export function insightSnoozeRepositoryContract(
  name: string,
  create: () => InsightSnoozeRepository | Promise<InsightSnoozeRepository>,
): void {
  describe(`${name} as an InsightSnoozeRepository`, () => {
    let repo: InsightSnoozeRepository;
    const day = CalendarDate.of(2026, 10, 25);
    const peanut: InsightSnooze = { kind: 'mostlyFat', subject: 'Peanut butter', item: 'Peanut butter', resumesOn: day };
    const bench: InsightSnooze = { kind: 'volumeJump', subject: 'barbell-bench-press', item: 'Barbell bench press', resumesOn: undefined };
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchInsightSnoozes())).toEqual([]);
    });

    it('keeps each snooze, timed or for always, by kind and item', async () => {
      await repo.saveInsightSnooze(bench);
      await repo.saveInsightSnooze(peanut);
      expect(await first(repo.watchInsightSnoozes())).toEqual([peanut, bench]);
    });

    it('a snooze of the same kind and item replaces the earlier one', async () => {
      await repo.saveInsightSnooze(peanut);
      await repo.saveInsightSnooze({ ...peanut, resumesOn: undefined });
      expect(await first(repo.watchInsightSnoozes())).toEqual([{ ...peanut, resumesOn: undefined }]);
    });

    it('turning a kind back on for an item removes only that snooze', async () => {
      await repo.saveInsightSnooze(peanut);
      await repo.saveInsightSnooze(bench);
      await repo.removeInsightSnooze('mostlyFat', 'Peanut butter');
      expect(await first(repo.watchInsightSnoozes())).toEqual([bench]);
      await repo.removeInsightSnooze('mostlyFat', 'Peanut butter');
      expect(await first(repo.watchInsightSnoozes())).toEqual([bench]);
    });
  });
}
