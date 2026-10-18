import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { InlineInsightLogEntry } from '../../src/engine/InlineInsightLogEntry';
import type { InlineInsightLogRepository } from '../../src/engine/InlineInsightLogRepository';
import { ItemAnchor } from '../../src/engine/ItemAnchor';
import { first } from '../support/first';

/** What every `InlineInsightLogRepository` must do (MM-363). */
export function inlineInsightLogRepositoryContract(
  name: string,
  create: () => InlineInsightLogRepository | Promise<InlineInsightLogRepository>,
): void {
  describe(`${name} as an InlineInsightLogRepository`, () => {
    let repo: InlineInsightLogRepository;
    const d1 = CalendarDate.of(2026, 10, 1);
    const d2 = CalendarDate.of(2026, 10, 9);
    const bench: InlineInsightLogEntry = {
      kind: 'volumeJump',
      area: 'training',
      anchor: ItemAnchor.exercise(4, 'barbell-bench-press'),
      item: 'Bench press',
      line: '14 sets for chest this week.',
      firstShownOn: d2,
    };
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchInlineInsightLog({ since: d1 }))).toEqual([]);
    });

    it('lists what was shown since a day, oldest first, as it was said', async () => {
      const squat = { ...bench, anchor: ItemAnchor.exercise(3, 'barbell-squat'), item: 'Squat', firstShownOn: d1 };
      await repo.recordInlineInsightShown(bench);
      await repo.recordInlineInsightShown(squat);
      expect(await first(repo.watchInlineInsightLog({ since: d1 }))).toEqual([squat, bench]);
      expect(await first(repo.watchInlineInsightLog({ since: d1.addDays(1) }))).toEqual([bench]);
    });

    it('keeps the first showing of a kind under an item', async () => {
      await repo.recordInlineInsightShown(bench);
      await repo.recordInlineInsightShown({ ...bench, line: 'Said again', firstShownOn: d2.addDays(1) });
      expect(await first(repo.watchInlineInsightLog({ since: d1 }))).toEqual([bench]);
    });

    it('keeps another kind under the same item apart', async () => {
      const other = { ...bench, kind: 'strengthOnFatLoss' };
      await repo.recordInlineInsightShown(bench);
      await repo.recordInlineInsightShown(other);
      expect((await first(repo.watchInlineInsightLog({ since: d1 }))).map((e) => e.kind)).toEqual(['volumeJump', 'strengthOnFatLoss']);
    });
  });
}
