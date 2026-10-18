import type { CalendarDate } from '../domain/CalendarDate';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { WaterGoal } from '../domain/water/WaterGoal';
import type { ItemInsight } from './ItemInsight';
import { WaterFewDaysRule } from './WaterFewDaysRule';

/**
 * The "water logged on few days" insight under the Dashboard's water row
 * (MM-367): water logged on fewer than half of the 14 complete days before
 * `today`. Said only with a goal in force that the app suggested (a goal
 * the person set while the suggestion is withheld, for a clinician's fluid
 * limit, kidney disease or bariatric surgery, gets no line: the panel's
 * SA-5), once the app has been in use for the whole window, and only for
 * someone who has logged water before (a feature never used gets no line:
 * the panel's ME-8). The day shown is not counted: a morning with no water
 * yet is not a day without water.
 */
export function waterFewDaysInsights({
  entries,
  goal,
  onboardedOn,
  today,
}: {
  /** The water logged over the window and the days before it that "used before" looks at. */
  entries: readonly WaterEntry[];
  goal: WaterGoal | undefined;
  onboardedOn: CalendarDate;
  today: CalendarDate;
}): ItemInsight[] {
  if (goal === undefined || goal.suggestedMl === undefined) return [];
  const from = today.addDays(-WaterFewDaysRule.windowDays);
  if (onboardedOn.isAfter(from)) return [];
  const usedSince = from.addDays(-WaterFewDaysRule.usedWithinDays);
  if (!entries.some((e) => e.date.isBefore(today) && !e.date.isBefore(usedSince))) return [];
  const days = new Set(
    entries.filter((e) => !e.date.isBefore(from) && e.date.isBefore(today)).map((e) => e.date.epochDay),
  );
  if (days.size >= WaterFewDaysRule.fewerThanDays) return [];
  return [
    {
      kind: 'waterFewDays',
      anchor: { kind: 'water', id: `${today.epochDay}` },
      subject: 'water',
      basis: 'pattern',
      figures: {
        daysWithWater: days.size,
        windowDays: WaterFewDaysRule.windowDays,
        goalMl: goal.ml,
        suggested: goal.suggested ? 1 : 0,
      },
      from,
      to: today.addDays(-1),
    },
  ];
}
