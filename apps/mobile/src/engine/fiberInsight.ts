import type { CalendarDate } from '../domain/CalendarDate';
import { FiberDay } from '../domain/food/fiber/FiberDay';
import { fiberGuideG } from '../domain/food/fiber/fiberGuideG';
import type { IntakeDay } from '../domain/IntakeDay';
import type { FiberPattern } from './FiberPattern';
import { FiberRule } from './FiberRule';
import { Insight } from './Insight';
import { InsightRationing } from './InsightRationing';
import { ReliefRule } from './ReliefRule';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The fiber insight (MM-126), or undefined: on a deficit, fiber averaging
 * under half the guide over the whole days that carry enough of it, and
 * hunger at the hard end at the latest check-in of the period, or no
 * check-in at all. Days with too little fiber data are left out, never read
 * as zero. The examples are foods the user already logs that carry at least
 * the guide's density, so the words are about fullness, never about a food
 * being good or bad.
 */
export function fiberInsight({
  pattern,
  whole,
  from,
  through,
  current,
}: {
  pattern: FiberPattern;
  /** The period's whole days. */
  whole: readonly IntakeDay[];
  from: CalendarDate;
  through: CalendarDate;
  /** The targets in force at the end of the period. */
  current: TargetsRecord | undefined;
}): Insight | undefined {
  if (current?.mode !== 'fatLoss') return undefined;
  const guideG = fiberGuideG({ kcalTarget: current.targets.kcal, sex: pattern.sex });

  const counted: number[] = [];
  for (const d of whole) {
    const day = FiberDay.of(pattern.days.get(d.date) ?? []);
    if (day.enough) counted.push(day.totalG);
  }
  if (counted.length < InsightRationing.minimumBasisDays) return undefined;
  const averageG = counted.reduce((s, g) => s + g, 0) / counted.length;
  if (averageG >= FiberRule.underShareOfGuide * guideG) return undefined;

  const inPeriod = pattern.checkIns.filter((c) => !c.date.isBefore(from) && !c.date.isAfter(through));
  const latest = inPeriod.reduce<(typeof inPeriod)[number] | undefined>(
    (l, c) => (l === undefined || c.date.isAfter(l.date) ? c : l),
    undefined,
  );
  if (latest !== undefined && latest.hunger > ReliefRule.hardAnswer) return undefined;

  // The densest foods logged in the period, each name once.
  const best = new Map<string, { name: string; density: number }>();
  for (const entries of pattern.days.values()) {
    for (const e of entries) {
      if (e.fiberG === undefined || e.kcal <= 0) continue;
      const density = e.fiberG / e.kcal;
      if (density < FiberRule.exampleGPerKcal) continue;
      const key = e.name.trim().toLowerCase();
      const known = best.get(key);
      if (known === undefined || density > known.density) best.set(key, { name: e.name.trim(), density });
    }
  }
  const ranked = [...best.values()].sort((a, b) => b.density - a.density).slice(0, FiberRule.mostExamples);
  const examples = ranked.length >= FiberRule.fewestExamples ? ranked.map((r) => r.name) : [];

  return new Insight({
    rule: 'fiberForFullness',
    from,
    to: through,
    figures: { averageG, guideG, countedDays: counted.length },
    examples,
  });
}
