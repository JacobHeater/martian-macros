import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import { nextTrendTransition, type TrendAnnouncement, type TrendReading } from '../../src/engine';
import { trendReading } from './support/trendReading';

/** MM-605: one key's state machine, as a pure function of its log and three readings. */
const e = CalendarDate.of(2026, 10, 20);

const entry = (
  transition: TrendAnnouncement['transition'],
  daysAgo: number,
  { direction = 'up', effect = 200, tier = 'clear' }: Partial<Pick<TrendAnnouncement, 'direction' | 'tier'>> & { effect?: number } = {},
): TrendAnnouncement => ({
  key: 'kcal:level',
  transition,
  on: e.addDays(-daysAgo),
  direction,
  onsetDate: e.addDays(-daysAgo - 5),
  figures: { effect, unit: 'kcal', n: 30, k: 10, span: 30, coverage: 1 },
  tier,
  rulesVersion: 1,
});

const step = (
  log: readonly TrendAnnouncement[],
  [asOf, dayBefore, twoDaysBefore]: readonly [TrendReading, TrendReading, TrendReading],
  resolutionIsGoodNews = true,
) => nextTrendTransition({ log, asOf, dayBefore, twoDaysBefore, resolutionIsGoodNews });

const days = (...states: Parameters<typeof trendReading>[1][]) =>
  states.map((state, i) => trendReading(e.addDays(-i), state)) as unknown as readonly [TrendReading, TrendReading, TrendReading];

describe('quiet', () => {
  it('new needs detection as of E and E−1', () => {
    expect(step([], days('up', 'quiet', 'quiet'))).toMatchObject({ transition: 'none', append: undefined, announced: false });
    const found = step([], days('up', 'up', 'quiet'));
    expect(found).toMatchObject({ transition: 'new', announced: true });
    expect(found.append).toMatchObject({ key: 'kcal:level', transition: 'new', on: e, direction: 'up', tier: 'clear', rulesVersion: 1 });
    expect(found.append?.figures).toMatchObject({ effect: 200, span: 30 });
  });

  it('a strong finding reports at once', () => {
    const strong = [trendReading(e, 'up', { tier: 'strong' }), trendReading(e.addDays(-1), 'quiet'), trendReading(e.addDays(-2), 'quiet')] as const;
    expect(step([], strong).transition).toBe('new');
  });

  it('two days the opposite ways are not a trend', () => {
    expect(step([], days('up', 'down', 'up')).transition).toBe('none');
  });
});

describe('reported', () => {
  const reported = [entry('new', 10)];

  it('continuing updates the figures silently', () => {
    expect(step(reported, days('up', 'up', 'up'))).toMatchObject({ transition: 'continuing', append: undefined, announced: false });
  });

  it('reversed needs the opposite direction as of E and E−1', () => {
    expect(step(reported, days('down', 'up', 'up')).transition).toBe('continuing');
    const reversed = step(reported, days('down', 'down', 'up'));
    expect(reversed).toMatchObject({ transition: 'reversed', announced: true });
    expect(reversed.append).toMatchObject({ transition: 'reversed', direction: 'down' });
  });

  it('resolved needs the exit threshold as of E, E−1 and E−2, and is said only where it is good news', () => {
    expect(step(reported, days('quiet', 'quiet', 'up')).transition).toBe('continuing');
    const resolved = step(reported, days('quiet', 'quiet', 'quiet'));
    expect(resolved).toMatchObject({ transition: 'resolved', announced: true });
    expect(resolved.append).toMatchObject({ transition: 'resolved', direction: 'up', on: e });
    expect(step(reported, days('quiet', 'quiet', 'quiet'), false)).toMatchObject({ transition: 'resolved', announced: false });
  });

  it('quiet but short of the exit threshold is still continuing', () => {
    const notExited = [0, 1, 2].map((i) =>
      trendReading(e.addDays(-i), 'quiet', { exited: { up: false, down: true } }),
    ) as unknown as readonly [TrendReading, TrendReading, TrendReading];
    expect(step(reported, notExited).transition).toBe('continuing');
  });

  it('is re-announced when the effect grows by half, at most every 14 days', () => {
    const grown = [0, 1, 2].map((i) => trendReading(e.addDays(-i), 'up', { effect: 300 })) as unknown as readonly [
      TrendReading,
      TrendReading,
      TrendReading,
    ];
    expect(step([entry('new', 14)], grown)).toMatchObject({ transition: 'update', announced: true });
    expect(step([entry('new', 13)], grown).transition).toBe('continuing');
    const slightly = [0, 1, 2].map((i) => trendReading(e.addDays(-i), 'up', { effect: 290 })) as unknown as readonly [
      TrendReading,
      TrendReading,
      TrendReading,
    ];
    expect(step([entry('new', 30)], slightly).transition).toBe('continuing');
  });

  it('is re-announced when the tier rises', () => {
    const stronger = [0, 1, 2].map((i) => trendReading(e.addDays(-i), 'up', { tier: 'strong' })) as unknown as readonly [
      TrendReading,
      TrendReading,
      TrendReading,
    ];
    expect(step([entry('new', 20)], stronger).transition).toBe('update');
  });

  it('a new rules version does not re-announce a continuing trend', () => {
    const found = nextTrendTransition({
      log: reported,
      asOf: trendReading(e, 'up'),
      dayBefore: trendReading(e.addDays(-1), 'up'),
      twoDaysBefore: trendReading(e.addDays(-2), 'up'),
      resolutionIsGoodNews: true,
      rulesVersion: 2,
    });
    expect(found).toMatchObject({ transition: 'continuing', append: undefined });
  });
});

describe('held', () => {
  it('data below the minimums holds the trend, and holding is logged once', () => {
    const held = step([entry('new', 10)], days('held', 'up', 'up'));
    expect(held).toMatchObject({ transition: 'held', announced: false });
    expect(held.append).toMatchObject({ transition: 'held', direction: 'up', on: e });
    expect(step([entry('new', 15), entry('held', 5)], days('held', 'held', 'held'))).toMatchObject({ transition: 'held', append: undefined });
  });

  it('missing data never resolves', () => {
    expect(step([entry('new', 10)], days('quiet', 'quiet', 'held')).transition).toBe('continuing');
    expect(step([entry('new', 15), entry('held', 5)], days('quiet', 'quiet', 'held')).transition).toBe('continuing');
  });

  it('the return from held is logged, as continuing', () => {
    const back = step([entry('new', 15), entry('held', 5)], days('up', 'held', 'held'));
    expect(back).toMatchObject({ transition: 'continuing', announced: false });
    expect(back.append).toMatchObject({ transition: 'continuing', direction: 'up' });
  });

  it('goes quiet after 21 days', () => {
    expect(step([entry('new', 40), entry('held', 21)], days('held', 'held', 'held')).transition).toBe('none');
    expect(step([entry('new', 40), entry('held', 21)], days('up', 'up', 'held')).transition).toBe('new');
  });
});

describe('resolved', () => {
  it('the same direction within 28 days is back again', () => {
    expect(step([entry('new', 40), entry('resolved', 28)], days('up', 'up', 'quiet'))).toMatchObject({
      transition: 'backAgain',
      announced: true,
    });
  });

  it('later, or the other way, is new', () => {
    expect(step([entry('new', 60), entry('resolved', 29)], days('up', 'up', 'quiet')).transition).toBe('new');
    expect(step([entry('new', 40), entry('resolved', 10)], days('down', 'down', 'quiet')).transition).toBe('new');
  });
});
