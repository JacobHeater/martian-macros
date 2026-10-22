import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { paceInWordsOf } from '../../src/engine/paceInWordsOf';
import { weighsOftenEnoughToOffer } from '../../src/engine/weighsOftenEnoughToOffer';
import { weightDisplayOf } from '../../src/engine/weightDisplayOf';
import { Fmt } from '../../src/format/Fmt';
import { paceInWordsText } from '../../src/format/paceInWordsText';
import { reminderPrompt } from '../../src/format/reminderPrompt';

/** MM-118: the weight display, the pace in words, and the offer's pattern. */
const today = CalendarDate.of(2026, 10, 5);

it('Words follow the data: a trend loss of 0.2% a week against an intended 0.75% is slower than planned', () => {
  expect(paceInWordsOf({ trendFractionPerWeek: -0.002, intendedFractionPerWeek: -0.0075 })).toBe('slowerThanPlanned');
  expect(paceInWordsText('slowerThanPlanned', { confident: true })).toBe('Slower than planned');
});

it('on pace near the plan, faster well beyond it, and slower going the other way', () => {
  expect(paceInWordsOf({ trendFractionPerWeek: -0.007, intendedFractionPerWeek: -0.0075 })).toBe('onPace');
  expect(paceInWordsOf({ trendFractionPerWeek: -0.013, intendedFractionPerWeek: -0.0075 })).toBe('fasterThanPlanned');
  expect(paceInWordsOf({ trendFractionPerWeek: 0.002, intendedFractionPerWeek: -0.0075 })).toBe('slowerThanPlanned');
  expect(paceInWordsOf({ trendFractionPerWeek: 0.0025, intendedFractionPerWeek: 0.0025 })).toBe('onPace');
});

it('with no change intended, a trend within 0.1% a week is steady', () => {
  expect(paceInWordsOf({ trendFractionPerWeek: 0.0005, intendedFractionPerWeek: 0 })).toBe('steady');
  expect(paceInWordsOf({ trendFractionPerWeek: -0.004, intendedFractionPerWeek: 0 })).toBe('fasterThanPlanned');
});

it('until the coach is sure, the words are approximate', () => {
  expect(paceInWordsText('onPace', { confident: false })).toBe('So far, on pace');
});

it('the default is Trend only with an eating-disorder history and Everything otherwise; a choice wins', () => {
  expect(weightDisplayOf(undefined, { eatingDisorderHistory: true })).toBe('trendOnly');
  expect(weightDisplayOf(undefined, { eatingDisorderHistory: false })).toBe('everything');
  expect(weightDisplayOf('everything', { eatingDisorderHistory: true })).toBe('everything');
  expect(weightDisplayOf('hidden', { eatingDisorderHistory: false })).toBe('hidden');
});

it('the offer: more than one weigh-in a day on five or more of the last fourteen days', () => {
  const several = (daysAgo: number[]) => daysAgo.map((d) => ({ date: today.addDays(-d), readings: 2 }));
  expect(weighsOftenEnoughToOffer({ days: several([0, 2, 4, 6, 8]), today })).toBe(true);
  expect(weighsOftenEnoughToOffer({ days: several([0, 2, 4, 6]), today })).toBe(false);
  expect(weighsOftenEnoughToOffer({ days: several([0, 2, 4, 6, 14]), today }), 'the fifth is fifteen days ago').toBe(false);
  const once = [0, 1, 2, 3, 4, 5].map((d) => ({ date: today.addDays(-d), readings: 1 }));
  expect(weighsOftenEnoughToOffer({ days: once, today })).toBe(false);
});

it('Hidden: a body weight has no figure in any unit; a lifted load still has one', () => {
  for (const units of ['metric', 'imperial'] as const) {
    const fmt = new Fmt(units, { weightDisplay: 'hidden' });
    expect(fmt.weight(80)).not.toMatch(/\d/);
    expect(fmt.weightDelta(-0.5)).not.toMatch(/\d/);
    expect(fmt.reading(80)).not.toMatch(/\d/);
    expect(fmt.load(100)).toMatch(/^\d/);
  }
});

it('Trend only: a single reading has no figure; the trend has one', () => {
  const fmt = new Fmt('metric', { weightDisplay: 'trendOnly' });
  expect(fmt.reading(80.4)).not.toMatch(/\d/);
  expect(fmt.weight(80.4)).toBe('80.4 kg');
  expect(new Fmt('metric').reading(80.4)).toBe('80.4 kg');
});

it('no notification carries a weight in any mode', () => {
  for (const kind of ['weighIn', 'logFood', 'weeklyMeasurement'] as const) {
    expect(reminderPrompt(kind)).not.toMatch(/\d/);
  }
});
