import { describe, expect, it } from 'vitest';
import { healthConnectSample } from '../../src/platform/healthConnectSample';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';

/** MM-68: a Health Connect reading as the app keeps it. */
const at = new Date(2026, 8, 1, 7, 2).getTime();

const record = (type: string, value: number | undefined, over: Partial<MmHealthRecord> = {}): MmHealthRecord => ({
  id: 'abc-123',
  type,
  ...(value === undefined ? {} : { value }),
  startMs: at,
  endMs: at,
  sourceId: 'com.example.scale',
  sourceName: 'Bathroom scale',
  ...over,
});

describe('healthConnectSample', () => {
  it('a weight keeps its value, time, id and source', () => {
    const sample = healthConnectSample(record('weight', 82.4));
    expect(sample?.type).toBe('weight');
    expect(sample?.value).toBe(82.4);
    expect(sample?.platformId).toBe('abc-123');
    expect(sample?.start).toEqual(new Date(2026, 8, 1, 7, 2));
    expect(sample?.end).toBeUndefined();
    expect(sample?.sourceId).toBe('com.example.scale');
    expect(sample?.sourceName).toBe('Bathroom scale');
  });

  // MM-395: a package id is never a name; no name stays none.
  it('a source with no name keeps no name, never its id', () => {
    expect(healthConnectSample(record('weight', 82.4, { sourceName: '' }))?.sourceName).toBe('');
  });

  it('a height in meters is kept in centimeters', () => {
    expect(healthConnectSample(record('height', 1.78))?.value).toBeCloseTo(178);
  });

  it('body fat, lean mass and steps keep the number as it is', () => {
    expect(healthConnectSample(record('bodyFat', 21.5))?.value).toBe(21.5);
    expect(healthConnectSample(record('leanMass', 61.2))?.value).toBe(61.2);
    expect(healthConnectSample(record('steps', 8042))?.value).toBe(8042);
  });

  it('a workout is kept as its length in minutes, with its span', () => {
    const sample = healthConnectSample(record('workout', undefined, { endMs: at + 45 * 60000 }));
    expect(sample?.value).toBe(45);
    expect(sample?.start).toEqual(new Date(at));
    expect(sample?.end).toEqual(new Date(at + 45 * 60000));
  });

  // MM-250: a sleep session is its minutes asleep, as the plugin summed them from the stages, or its span without stages.
  it('a sleep session keeps the minutes the plugin summed, or its span when it gave none', () => {
    const night = record('sleep', 395, { startMs: at - 8 * 3600000, endMs: at });
    expect(healthConnectSample(night)?.value).toBe(395);
    expect(healthConnectSample(night)?.end?.getTime()).toBe(at);
    expect(healthConnectSample(record('sleep', undefined, { startMs: at - 7.5 * 3600000, endMs: at }))?.value).toBe(450);
  });

  it('a day of menstrual flow is kept as 1, whatever the platform says', () => {
    expect(healthConnectSample(record('menstruation', 3))?.value).toBe(1);
  });

  it('a reading that spans no time has no end', () => {
    expect(healthConnectSample(record('steps', 100))?.end).toBeUndefined();
  });

  it('a numeric type with no number is not imported', () => {
    expect(healthConnectSample(record('weight', undefined))).toBeUndefined();
    expect(healthConnectSample(record('height', undefined))).toBeUndefined();
  });

  it('a kind of reading the app does not import gives nothing', () => {
    expect(healthConnectSample(record('BLOOD_GLUCOSE', 5.5))).toBeUndefined();
  });

  it('a body-fat reading is its app and its device: two scales through one app keep their own source (MM-502)', () => {
    const a = healthConnectSample(record('bodyFat', 21.5, { deviceId: 'Withings Body+' }));
    const b = healthConnectSample(record('bodyFat', 24, { deviceId: 'Withings Body Cardio' }));
    expect(a?.sourceId).toBe('com.example.scale|Withings Body+');
    expect(b?.sourceId).toBe('com.example.scale|Withings Body Cardio');
    // No device named: the app alone, as before.
    expect(healthConnectSample(record('bodyFat', 21.5, { deviceId: '' }))?.sourceId).toBe('com.example.scale');
    // A weight keeps the app alone as its source, whatever device it names.
    expect(healthConnectSample(record('weight', 82.4, { deviceId: 'Withings Body+' }))?.sourceId).toBe('com.example.scale');
  });

  it('a body-fat figure typed in by hand is not a scale reading and is not imported (MM-502)', () => {
    expect(healthConnectSample(record('bodyFat', 18, { manual: true }))).toBeUndefined();
    expect(healthConnectSample(record('bodyFat', 18, { manual: false }))?.value).toBe(18);
  });
});
