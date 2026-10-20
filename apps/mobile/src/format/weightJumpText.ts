import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightJumpExplanation } from '../engine/WeightJumpExplanation';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';
import { weightJumpCauseText } from './weightJumpCauseText';

type Evidence = readonly (readonly [label: string, value: string])[];

/** Energy to the nearest hundred, said as "about 10,400 kcal". */
const aboutKcal = (kcal: number) => `about ${Fmt.kcal(roundHalfAwayFromZero(kcal / 100) * 100)}`;

/**
 * What is said when a weigh-in is far from the trend (MM-142), and the
 * figures behind it. The line is the distance and the likely cause(s); the
 * specific cause leads when there is one, since reassurance without a
 * reason is what the chart's general sentence already fails to give. With
 * nothing in the log it says so and offers a weight event, where it is
 * (`place`). A low reading gets the mirrored words and that it will
 * probably come back, because a false win misleads as much as a false
 * loss. The arithmetic is in the figures, once: what it would have taken
 * for the difference to be fat, or, after a day far over target, the most
 * of it that could be fat and that the rest is water and food (the panel's
 * PD-1 and UX-2: the line stays a line). Causes are likely, never certain
 * (MM-108).
 */
export function weightJumpText(
  e: WeightJumpExplanation,
  fmt: Fmt,
  today: CalendarDate,
  { place = 'dashboard' }: { place?: 'dashboard' | 'progress' } = {},
): { line: string; evidence: Evidence } {
  const daysAgo = e.date.daysUntil(today);
  const size = fmt.weight(Math.abs(e.deviationKg));
  const side = e.above ? 'above' : 'below';
  const head =
    daysAgo === 0
      ? `Today’s weigh-in is ${size} ${side} your trend.`
      : daysAgo === 1
        ? `Yesterday’s weigh-in was ${size} ${side} your trend.`
        : `The weigh-in on ${Fmt.day(e.date, today)} was ${size} ${side} your trend.`;

  const sentences = [head];
  const evidence: (readonly [string, string])[] = [
    ['Weigh-in', fmt.weight(e.readingKg)],
    ['Trend', fmt.weight(e.trendKg)],
    [e.above ? 'Above the trend by' : 'Below the trend by', size],
    ['Day-to-day noise', `about ${fmt.weight(e.thresholdKg)}`],
  ];

  if (e.causes.length === 0) {
    const where = place === 'progress' ? 'under Weight events below' : 'as a weight event in Progress';
    sentences.push(
      'Nothing in your log explains this. Day-to-day changes this size are normal and usually water.',
      `If something happened, such as illness, travel or a salty meal, add it ${where}.`,
    );
  } else {
    const clauses = e.causes.map((cause) => weightJumpCauseText(cause, fmt));
    sentences.push(`Likely ${e.causes.length === 1 ? 'cause' : 'causes'}: ${clauses.map((c) => c.clause).join('; ')}.`);
    for (const clause of clauses) evidence.push(...clause.evidence);
  }
  if (!e.above) sentences.push('This is most likely water and will probably come back.');

  const calories = e.calories;
  if (calories === undefined) {
    evidence.push([
      e.above ? 'For this to be fat' : 'For this to be fat loss',
      `${aboutKcal(e.fatKcal)} ${e.above ? 'over' : 'under'} your expenditure yesterday`,
    ]);
  } else {
    // Honest in both directions: a day far over target is not hidden, and neither is how little of it can be fat.
    const atMost = calories.figures['fatAtMostKg'] ?? 0;
    evidence.push([
      e.above ? 'Fat this could have stored' : 'Fat this could have lost',
      atMost > 0 ? `At most about ${fmt.weight(atMost)}` : `None: still ${e.above ? 'under' : 'over'} your expenditure`,
    ]);
    evidence.push(['The rest of the difference', e.above ? 'Water and food still being digested' : 'Water and less food in you']);
  }
  return { line: sentences.join(' '), evidence };
}
