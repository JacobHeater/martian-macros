import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ReminderKind } from '../../src/domain/ReminderKind';
import { ReminderSetting } from '../../src/domain/ReminderSetting';
import type { ReminderRepository } from '../../src/domain/repositories/ReminderRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `ReminderRepository` must do. */
export function reminderRepositoryContract(
  name: string,
  create: () => ReminderRepository | Promise<ReminderRepository>,
): void {
  describe(`${name} as a ReminderRepository`, () => {
    let repo: ReminderRepository;
    const day = CalendarDate.of(2026, 1, 1);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty: nothing is on until the user turns it on', async () => {
      expect(await first(repo.watchReminders())).toEqual([]);
    });

    it('keeps every field', async () => {
      await repo.saveReminder(
        new ReminderSetting({ kind: 'logFood', enabled: true, minuteOfDay: 19 * 60 + 30, countFrom: day }),
      );
      const saved = single(await first(repo.watchReminders()));
      expect(saved.kind).toBe('logFood');
      expect(saved.enabled).toBe(true);
      expect(saved.minuteOfDay).toBe(19 * 60 + 30);
      expect(saved.countFrom).toBe(day);
    });

    it('a setting that was never on has no count-from day', async () => {
      await repo.saveReminder(new ReminderSetting({ kind: 'weighIn', minuteOfDay: 420 }));
      const saved = single(await first(repo.watchReminders()));
      expect(saved.enabled).toBe(false);
      expect(saved.countFrom).toBeUndefined();
    });

    it('keeps one setting per kind, listed in the order of kinds', async () => {
      for (const kind of [...ReminderKind.values].reverse()) {
        await repo.saveReminder(new ReminderSetting({ kind, minuteOfDay: 480 }));
      }
      await repo.saveReminder(new ReminderSetting({ kind: 'weighIn', minuteOfDay: 400 }));
      const saved = await first(repo.watchReminders());
      expect(saved.map((s) => s.kind)).toEqual(ReminderKind.values);
      expect(saved[0]?.minuteOfDay).toBe(400);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchReminders(), {
        see: (settings) => settings.length,
        before: 0,
        change: () => repo.saveReminder(new ReminderSetting({ kind: 'weighIn', minuteOfDay: 420 })),
        after: 1,
      });
    });
  });
}
