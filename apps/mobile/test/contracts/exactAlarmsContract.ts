import { describe, expect, it } from 'vitest';
import type { ExactAlarms } from '../../src/domain/integration/ExactAlarms';
import { ReminderTiming } from '../../src/domain/ReminderTiming';

/** What every `ExactAlarms` must do (MM-248). */
export function exactAlarmsContract(name: string, create: () => ExactAlarms): void {
  describe(`${name} as ExactAlarms`, () => {
    it('answers one of the timings, and reading it asks nothing', async () => {
      const alarms = create();
      const before = await alarms.timing();
      expect(ReminderTiming.values).toContain(before);
      expect(await alarms.timing()).toBe(before);
    });

    it('once the person has answered, they are never "not asked" again', async () => {
      for (const answer of ['openSetting', 'notNow'] as const) {
        const alarms = create();
        const after = await alarms[answer]();
        expect(after, answer).not.toBe('notAsked');
        expect(await alarms.timing(), answer).toBe(after);
      }
    });

    it('"Not now" changes nothing but the asking', async () => {
      const alarms = create();
      const before = await alarms.timing();
      expect(await alarms.notNow()).toBe(before === 'onTheMinute' ? 'onTheMinute' : 'withinAnHour');
    });
  });
}
