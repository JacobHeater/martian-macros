import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Clock } from '../../src/domain/integration/Clock';

/** What every `Clock` must do. */
export function clockContract(name: string, create: () => Clock): void {
  describe(`${name} as a Clock`, () => {
    it('today is the calendar day of now', () => {
      const clock = create();
      const now = clock.now();
      expect(clock.today().epochDay, 'now and today agree on the day').toBe(CalendarDate.fromDate(now).epochDay);
    });
  });
}
