import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { HealthSample } from '../../src/healthIngest/HealthSample';
import { bodyFatReadingsOf } from '../../src/state/bodyFatReadingsOf';

/** MM-502: body-fat readings from the health platform, each kept with the scale that wrote it. */
it('each reading is on its day, from its scale, as a bioimpedance reading; other kinds are left out', () => {
  const sample = (platformId: string, type: HealthSample['type'], value: number, sourceId: string): HealthSample => ({
    platformId,
    type,
    value,
    start: new Date(2026, 9, 20, 7, 2),
    sourceId,
    sourceName: '',
  });
  expect(
    bodyFatReadingsOf([sample('f-1', 'bodyFat', 21.4, 'com.example.scale'), sample('w-1', 'weight', 80, 'com.example.scale'), sample('f-2', 'bodyFat', 25, 'com.other.scale')]),
  ).toEqual([
    { date: CalendarDate.of(2026, 10, 20), percent: 21.4, method: 'bia', deviceId: 'com.example.scale' },
    { date: CalendarDate.of(2026, 10, 20), percent: 25, method: 'bia', deviceId: 'com.other.scale' },
  ]);
});
