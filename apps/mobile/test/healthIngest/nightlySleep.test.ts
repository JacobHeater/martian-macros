import { describe, expect, it } from 'vitest';
import type { HealthSample } from '../../src/healthIngest/HealthSample';
import { nightlySleep } from '../../src/healthIngest/nightlySleep';

/** MM-250: a health platform's sleep sessions, summed into one night each. */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute);

const session = (
  id: string,
  start: Date,
  end: Date,
  { source = 'watch', name = 'Watch', type = 'sleep' as HealthSample['type'] } = {},
): HealthSample => ({
  platformId: id,
  type,
  value: (end.getTime() - start.getTime()) / 60000,
  start,
  end,
  sourceId: source,
  sourceName: name,
});

describe('nightlySleep', () => {
  it('a night belongs to the day it ended on, and its sessions are summed', () => {
    const nights = nightlySleep([
      session('a', at(5, 23, 10), at(6, 2, 0)),
      session('b', at(6, 2, 20), at(6, 6, 30)),
      session('c', at(6, 23, 0), at(7, 6, 0)),
    ]);
    expect(nights.map((n) => [n.day.getDate(), n.minutes, n.sessions])).toEqual([
      [6, 170 + 250, 2],
      [7, 420, 1],
    ]);
    expect(nights[0]?.sourceName).toBe('Watch');
  });

  it('the first source to report a night wins, and the other is not added to it', () => {
    const phone = { source: 'phone', name: 'Phone' };
    const nights = nightlySleep([
      session('p', at(5, 23, 30), at(6, 6, 30), phone),
      session('w', at(5, 23, 0), at(6, 6, 20)),
      session('w2', at(6, 6, 40), at(6, 7, 0)),
    ]);
    expect(nights).toHaveLength(1);
    expect(nights[0]?.minutes).toBe(440 + 20);
    expect(nights[0]?.sourceName).toBe('Watch');
  });

  it('the same sessions in any order give the same answer', () => {
    const sessions = [
      session('p', at(5, 23, 30), at(6, 6, 30), { source: 'phone', name: 'Phone' }),
      session('w', at(5, 23, 0), at(6, 6, 20)),
      session('n', at(6, 22, 0), at(7, 5, 0)),
    ];
    const forward = nightlySleep(sessions);
    const backward = nightlySleep([...sessions].reverse());
    expect(backward).toEqual(forward);
  });

  it('a tie on when the night began goes to the source id that sorts first', () => {
    const nights = nightlySleep([
      session('b', at(5, 23, 0), at(6, 6, 0), { source: 'b-app', name: 'B' }),
      session('a', at(5, 23, 0), at(6, 7, 0), { source: 'a-app', name: 'A' }),
    ]);
    expect(nights[0]?.sourceName).toBe('A');
    expect(nights[0]?.minutes).toBe(480);
  });

  it('other kinds of reading are not sleep, and a session with no end is kept against its start', () => {
    const sleep = session('s', at(5, 23, 0), at(6, 6, 0));
    const workout = session('x', at(6, 18, 0), at(6, 19, 0), { type: 'workout' });
    const noEnd: HealthSample = { ...session('n', at(6, 1, 0), at(6, 1, 0)), end: undefined, value: 300 };
    const nights = nightlySleep([workout, sleep, noEnd]);
    expect(nights.map((n) => [n.day.getDate(), n.minutes])).toEqual([[6, 420 + 300]]);
  });

  it('a source the platform did not name is said as none, never by its id', () => {
    const nights = nightlySleep([session('s', at(5, 23, 0), at(6, 6, 0), { source: 'com.example.phone', name: '' })]);
    expect(nights[0]?.sourceName).toBe('');
  });
});
