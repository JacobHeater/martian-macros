import type { CalendarDate } from '../../../domain/CalendarDate';
import type { CoachFinding } from '../CoachFinding';
import type { CoachFindingKind } from '../CoachFindingKind';
import { FoodSignalId } from '../food/FoodSignalId';
import type { CoachFollowUp } from './CoachFollowUp';
import { CoachFollowUpKind } from './CoachFollowUpKind';

const proteinSignals: readonly string[] = ['proteinMinimum', 'proteinTarget', 'proteinDensity', 'proteinByMeal'];

const names = (x: CoachFinding, key: string | undefined) =>
  key !== undefined && (x.advice?.some((a) => a.food?.key === key) === true || x.cause?.food?.key === key);

/** Where a follow-up may ride, best first: each test is tried over every finding before the next. */
function placesFor(f: CoachFollowUp): readonly ((x: CoachFinding) => boolean)[] {
  const key = f.food?.key;
  switch (f.kind) {
    case 'saidBefore':
      return [(x) => x.kind === 'fix' && names(x, key)];
    case 'adviceTaken':
      return [(x) => (x.kind === 'fix' || x.kind === 'holdingUp') && x.advice?.some((a) => a.food?.key === key) === true];
    case 'repeatOver':
      return [
        (x) => x.kind === 'fix' && FoodSignalId.family(x.signal as FoodSignalId) === 'calories',
        (x) => x.kind === 'fix' && (names(x, key) || (f.meal !== undefined && x.cause?.meal === f.meal)),
        (x) => x.kind === 'close',
      ];
    case 'repeatFat':
      return [
        (x) => x.kind === 'fix' && x.signal === 'fatAgainstTarget',
        (x) => x.kind === 'fix' && FoodSignalId.family(x.signal as FoodSignalId) === 'calories',
        (x) => x.kind === 'close',
      ];
    case 'repeatProteinShort':
      return [(x) => x.kind === 'fix' && proteinSignals.includes(x.signal), (x) => x.kind === 'left'];
  }
}

/** The figures of a follow-up said on its own, for "The numbers behind this". */
function figuresOf(f: CoachFollowUp, today: CalendarDate): Record<string, number> {
  const all: Record<string, number | undefined> = {
    kcal: f.food?.kcal,
    givenKcal: f.givenKcal,
    daysAgo: f.givenOn === undefined ? undefined : f.givenOn.daysUntil(today),
    days: f.days,
    ofDays: f.ofDays,
    overByKcal: f.overByKcal,
    drivenDays: f.drivenDays,
    beforeDays: f.beforeDays,
    savedKcal: f.savedKcal,
  };
  return Object.fromEntries(Object.entries(all).flatMap(([k, v]) => (v === undefined ? [] : [[k, v] as const])));
}

/**
 * 1d's findings with the coach's follow-ups on them (MM-617). Each rides on
 * the finding about the same food or meal (`CoachFinding.followUps`):
 *
 * - said before: the fix whose order or cause names the food;
 * - advice taken: the finding whose order names the food;
 * - over by 500 again: the calorie line, else the fix about the food or
 *   meal that drove it, else the closing line;
 * - fat over again: the fat line, else the calorie line, else the closing
 *   line;
 * - protein short again: a protein line, else what is left today.
 *
 * One with nowhere to ride is a finding of its own, today's
 * (`day:<epochDay>:<signal>:<kind>:<follow-up>[:<food key>]`), of kind
 * 'fix' (signals `saidBefore`, `repeatOver`) or 'holdingUp' (`adviceTaken`),
 * a pattern by priority (MM-141), after the analysis's own.
 */
export function withCoachFollowUps(
  findings: readonly CoachFinding[],
  followUps: readonly CoachFollowUp[],
  today: CalendarDate,
): CoachFinding[] {
  const out = [...findings];
  const own: CoachFinding[] = [];
  for (const f of followUps) {
    let at = -1;
    for (const fits of placesFor(f)) {
      at = out.findIndex(fits);
      if (at >= 0) break;
    }
    const host = out[at];
    if (host !== undefined) {
      out[at] = { ...host, followUps: [...(host.followUps ?? []), f] };
      continue;
    }
    const signal = CoachFollowUpKind.signal(f.kind);
    const kind: CoachFindingKind = f.kind === 'adviceTaken' ? 'holdingUp' : 'fix';
    own.push({
      id: `day:${today.epochDay}:${signal}:${kind}:${f.kind}${f.food === undefined ? '' : `:${f.food.key}`}`,
      signal,
      kind,
      span: 1,
      from: today,
      to: today,
      priority: 'pattern',
      figures: figuresOf(f, today),
      foods: [],
      trade: undefined,
      trend: undefined,
      followUps: [f],
    });
  }
  return [...out, ...own];
}
