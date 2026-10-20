import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WeightJumpCause } from '../../src/engine/WeightJumpCause';
import { WeightJumpExplanation } from '../../src/engine/WeightJumpExplanation';
import { Fmt } from '../../src/format/Fmt';
import { weightJumpText } from '../../src/format/weightJumpText';

/** MM-142: the words of a weigh-in's explanation. */
const today = CalendarDate.of(2026, 10, 20);
const metric = new Fmt('metric');

const explanation = (causes: readonly WeightJumpCause[], { readingKg = 81.1, date = today }: { readingKg?: number; date?: CalendarDate } = {}) =>
  new WeightJumpExplanation({ date, readingKg, trendKg: 80, thresholdKg: 0.48, causes, fatKcal: Math.abs(readingKg - 80) * 9440 });

describe('the line', () => {
  it('leads with the specific cause, both figures given; the arithmetic is in the figures, once', () => {
    const { line, evidence } = weightJumpText(explanation([{ kind: 'carbohydrate', figures: { daysAgo: 1, amount: 340, usual: 230 } }]), metric, today);
    // The line stays a line (the panel's PD-1, UX-2): the distance and the likely cause.
    expect(line).toBe('Today’s weigh-in is 1.1 kg above your trend. Likely cause: carbohydrate yesterday, 340 g against your usual 230 g.');
    expect(evidence).toEqual([
      ['Weigh-in', '81.1 kg'],
      ['Trend', '80.0 kg'],
      ['Above the trend by', '1.1 kg'],
      ['Day-to-day noise', 'about 0.5 kg'],
      ['Carbohydrate yesterday', '340 g'],
      ['Usual carbohydrate', '230 g a day'],
      ['For this to be fat', 'about 10,400 kcal over your expenditure yesterday'],
    ]);
  });

  it('lists several causes in order, as clauses of one sentence', () => {
    const { line } = weightJumpText(
      explanation([
        { kind: 'carbohydrate', figures: { daysAgo: 1, amount: 340, usual: 230 } },
        { kind: 'alcohol', figures: { daysAgo: 1, alcoholG: 28 } },
        { kind: 'workout', figures: { daysAgo: 2 } },
      ]),
      metric,
      today,
    );
    expect(line).toContain('Likely causes: carbohydrate yesterday, 340 g against your usual 230 g; alcohol yesterday, 28 g; a workout the day before.');
  });

  it('with nothing in the log says so, that this is normal, and offers a weight event where the person is', () => {
    const { line, evidence } = weightJumpText(explanation([]), metric, today);
    expect(line).toContain('Nothing in your log explains this. Day-to-day changes this size are normal and usually water.');
    expect(line).toContain('add it as a weight event in Progress.');
    expect(evidence).toContainEqual(['For this to be fat', 'about 10,400 kcal over your expenditure yesterday']);
    // On Progress the Weight events section is one scroll down (the panel's UX-6).
    expect(weightJumpText(explanation([]), metric, today, { place: 'progress' }).line).toContain('add it under Weight events below.');
  });

  it('a low reading after an illness is likely water that will probably come back', () => {
    const { line } = weightJumpText(
      explanation([{ kind: 'weightEvent', figures: { daysAgo: 1 }, eventType: 'illness' }], { readingKg: 79 }),
      metric,
      today,
    );
    expect(line).toBe(
      'Today’s weigh-in is 1.0 kg below your trend. Likely cause: illness you noted yesterday. This is most likely water and will probably come back.',
    );
    expect(weightJumpText(explanation([{ kind: 'weightEvent', figures: { daysAgo: 1 }, eventType: 'illness' }], { readingKg: 79 }), metric, today).evidence).toContainEqual([
      'For this to be fat loss',
      'about 9,400 kcal under your expenditure yesterday',
    ]);
  });

  it('a day far over target says how much could be fat at most, and that the rest is water and food', () => {
    const calories: WeightJumpCause = {
      kind: 'calories',
      figures: { kcal: 5100, targetKcal: 2100, overTargetKcal: 3000, overExpenditureKcal: 2600, fatAtMostKg: 0.275 },
    };
    const { line, evidence } = weightJumpText(explanation([calories]), metric, today);
    expect(line).toBe('Today’s weigh-in is 1.1 kg above your trend. Likely cause: calories yesterday, 5,100 kcal against a 2,100 kcal target.');
    expect(evidence).toContainEqual(['Over target by', '3,000 kcal']);
    expect(evidence).toContainEqual(['Fat at most', '0.3 kg']);
    expect(evidence).toContainEqual(['Expenditure estimate', '2,500 kcal']);
    expect(evidence).toContainEqual(['Fat this could have stored', 'At most about 0.3 kg']);
    expect(evidence).toContainEqual(['The rest of the difference', 'Water and food still being digested']);
    expect(evidence.some(([label]) => label === 'For this to be fat')).toBe(false);
  });

  it('over target but under expenditure could store no fat', () => {
    const calories: WeightJumpCause = {
      kind: 'calories',
      figures: { kcal: 2400, targetKcal: 2100, overTargetKcal: 300, overExpenditureKcal: -100, fatAtMostKg: 0 },
    };
    expect(weightJumpText(explanation([calories]), metric, today).evidence).toContainEqual(['Fat this could have stored', 'None: still under your expenditure']);
  });

  it('names an older reading by its day, in the person’s units', () => {
    const imperial = new Fmt('imperial');
    const { line } = weightJumpText(explanation([], { date: today.addDays(-3) }), imperial, today);
    expect(line).toMatch(/^The weigh-in on Sat, Oct 17 was 2\.4 lb above your trend\./);
    expect(weightJumpText(explanation([], { date: today.addDays(-1) }), imperial, today).line).toMatch(/^Yesterday’s weigh-in was/);
  });

  it('says every other cause in the domain’s words', () => {
    const causes: WeightJumpCause[] = [
      { kind: 'sodium', figures: { daysAgo: 2, amount: 4000, usual: 2000 } },
      { kind: 'cycleWindow', figures: {} },
      { kind: 'phaseChange', figures: { daysSince: 4 } },
    ];
    const { line, evidence } = weightJumpText(explanation(causes), metric, today);
    expect(line).toContain('sodium the day before, 4,000 mg against your usual 2,000 mg; the days around a period start, when the body holds more water; your targets changing 4 days ago');
    expect(evidence).toContainEqual(['Targets changed', '4 days ago']);
    const creatine = weightJumpText(explanation([{ kind: 'weightEvent', figures: { daysAgo: 0 }, eventType: 'startedCreatine' }]), metric, today);
    expect(creatine.line).toContain('Likely cause: starting creatine you noted today.');
  });
});
