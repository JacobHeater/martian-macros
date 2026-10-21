import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import type { UserSetup } from '../domain/UserSetup';
import type { MissedPeriod } from './MissedPeriod';
import { MissedPeriodRule } from './MissedPeriodRule';

/**
 * Whether this week's recovery check-in asks about a missed period (MM-116):
 * a female profile not past menopause, whose last `regularCycles` marked
 * cycles (MM-20) each ran `shortestCycleDays` to `longestCycleDays`, and
 * whose last period started `askFromDays` or more ago. Asked once a gap: not
 * after a check-in has been answered since the day it began to qualify. The
 * answer is not stored. A male profile is never asked. A start is a marked
 * day whose previous day was not marked, as `cycleWindows` has it.
 */
export function missedPeriodQuestion({
  setup,
  flowDays,
  checkIns,
  today,
}: {
  setup: UserSetup;
  flowDays: Iterable<MenstruationDay>;
  checkIns: readonly RecoveryCheckIn[];
  today: CalendarDate;
}): MissedPeriod | undefined {
  if (setup.profile.sex !== 'female' || setup.screening.menopause) return undefined;
  const marked = new Map<number, CalendarDate>();
  for (const d of flowDays) if (!d.date.isAfter(today)) marked.set(d.date.epochDay, d.date);
  const starts = [...marked.values()].filter((date) => !marked.has(date.epochDay - 1)).sort((a, b) => a.compareTo(b));
  if (starts.length < MissedPeriodRule.regularCycles + 1) return undefined;
  const recent = starts.slice(starts.length - MissedPeriodRule.regularCycles - 1);
  for (let i = 1; i < recent.length; i++) {
    const length = (recent[i - 1] as CalendarDate).daysUntil(recent[i] as CalendarDate);
    if (length < MissedPeriodRule.shortestCycleDays || length > MissedPeriodRule.longestCycleDays) return undefined;
  }
  const lastStartOn = recent[recent.length - 1] as CalendarDate;
  const daysSince = lastStartOn.daysUntil(today);
  if (daysSince < MissedPeriodRule.askFromDays) return undefined;
  const asksFrom = lastStartOn.addDays(MissedPeriodRule.askFromDays);
  if (checkIns.some((c) => !c.date.isBefore(asksFrom) && c.date.isBefore(today))) return undefined;
  return { lastStartOn, daysSince, noticeIfNotSure: setup.goalMode === 'fatLoss' || setup.goalMode === 'recomp' };
}
