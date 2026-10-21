import { describe, expect, it } from 'vitest';
import { HealthSyncReason, HealthSyncSchedule } from '../../src/healthIngest';

/** MM-72: when the health platform is read, so the battery is not spent on it. */
const now = new Date(2026, 9, 21, 8, 0);
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

describe('HealthSyncSchedule', () => {
  it('reads for every reason when nothing has been read yet', () => {
    for (const reason of HealthSyncReason.values) {
      expect(HealthSyncSchedule.due(reason, undefined, now)).toBe(true);
    }
  });

  it('opening the app always reads, even just after a read', () => {
    expect(HealthSyncSchedule.due('opened', minutesAgo(0), now)).toBe(true);
  });

  it('asking always reads, even just after a read', () => {
    expect(HealthSyncSchedule.due('asked', minutesAgo(1), now)).toBe(true);
  });

  it('coming back to the front soon after a read does not read again', () => {
    expect(HealthSyncSchedule.due('resumed', minutesAgo(0), now)).toBe(false);
    expect(HealthSyncSchedule.due('resumed', minutesAgo(14), now)).toBe(false);
  });

  it('coming back to the front once the interval has passed reads again', () => {
    expect(HealthSyncSchedule.resumeIntervalMs).toBe(15 * 60 * 1000);
    expect(HealthSyncSchedule.due('resumed', minutesAgo(15), now)).toBe(true);
    expect(HealthSyncSchedule.due('resumed', minutesAgo(6 * 7 * 24 * 60), now)).toBe(true);
  });

  it('a clock moved backwards reads again rather than waiting', () => {
    expect(HealthSyncSchedule.due('resumed', minutesAgo(-60), now)).toBe(true);
  });
});
