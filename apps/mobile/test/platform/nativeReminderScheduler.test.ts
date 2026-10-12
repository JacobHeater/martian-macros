import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { MmRemindersApi } from '../../src/platform/MmRemindersApi';
import { NativeReminderScheduler } from '../../src/platform/NativeReminderScheduler';

/** MM-146: what the phone is asked to schedule. */
describe('NativeReminderScheduler', () => {
  const make = () => {
    const replaced: { title: string; atMs: number }[][] = [];
    let granted = false;
    const api: MmRemindersApi = {
      requestPermission: async () => ({ granted }),
      replaceAll: async ({ reminders }) => {
        replaced.push(reminders);
      },
    };
    const scheduler = new NativeReminderScheduler({ api, prompt: (kind) => `prompt for ${kind}` });
    return { scheduler, replaced, grant: () => (granted = true) };
  };

  it('a reminder is scheduled at its local wall-clock time, with only its prompt', async () => {
    const { scheduler, replaced } = make();
    await scheduler.replaceAll([{ kind: 'weighIn', date: CalendarDate.of(2026, 10, 13), minuteOfDay: 7 * 60 + 30 }]);
    expect(replaced).toEqual([
      [{ title: 'prompt for weighIn', atMs: new Date(2026, 9, 13, 7, 30).getTime() }],
    ]);
  });

  it('replacing with nothing cancels everything', async () => {
    const { scheduler, replaced } = make();
    await scheduler.replaceAll([]);
    expect(replaced).toEqual([[]]);
  });

  it('permission is whatever the system answers', async () => {
    const { scheduler, grant } = make();
    expect(await scheduler.requestPermission()).toBe(false);
    grant();
    expect(await scheduler.requestPermission()).toBe(true);
  });
});
