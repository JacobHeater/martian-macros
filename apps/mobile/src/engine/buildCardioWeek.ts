import type { CalendarDate } from '../domain/CalendarDate';
import type { CardioActivity } from '../domain/training/CardioActivity';
import type { CardioFloors } from '../domain/training/CardioFloors';
import type { CardioSession } from '../domain/training/CardioSession';
import type { StepsDay } from '../domain/training/StepsDay';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { CardioRule } from './CardioRule';
import type { CardioWeek } from './CardioWeek';
import type { CardioWeekTotals } from './CardioWeekTotals';

/** The totals of the seven days ending on `through`. */
function totalsOf(sessions: readonly CardioSession[], steps: readonly StepsDay[], through: CalendarDate): CardioWeekTotals {
  const from = through.addDays(-6);
  const within = (date: CalendarDate) => !date.isBefore(from) && !date.isAfter(through);
  const byActivity = new Map<CardioActivity, { minutes: number; sessions: number }>();
  let minutes = 0;
  let count = 0;
  for (const session of sessions) {
    if (!within(session.date)) continue;
    minutes += session.minutes;
    count++;
    const entry = byActivity.get(session.activity) ?? { minutes: 0, sessions: 0 };
    entry.minutes += session.minutes;
    entry.sessions++;
    byActivity.set(session.activity, entry);
  }
  const days = steps.filter((day) => within(day.date));
  const stepsSum = days.reduce((sum, day) => sum + day.steps, 0);
  return {
    minutes,
    sessions: count,
    byActivity: [...byActivity.entries()]
      .map(([activity, entry]) => ({ activity, ...entry }))
      .sort((a, b) => b.minutes - a.minutes || a.activity.localeCompare(b.activity)),
    stepsPerDay: days.length === 0 ? undefined : roundHalfAwayFromZero(stepsSum / days.length),
    stepsDays: days.length,
  };
}

/**
 * Cardio over the last seven days beside the seven before (MM-677): the
 * minutes in all and by activity, the sessions, and steps a day on average
 * over the days with a total, read against the floors in force (MM-678):
 * the person's, or the coach's defaults. Nothing is summed into energy
 * (MM-23).
 */
export function buildCardioWeek({
  sessions,
  steps,
  floors,
  today,
}: {
  sessions: readonly CardioSession[];
  steps: readonly StepsDay[];
  floors: CardioFloors;
  today: CalendarDate;
}): CardioWeek {
  const from = today.addDays(-6);
  return {
    today,
    current: totalsOf(sessions, steps, today),
    previous: totalsOf(sessions, steps, today.addDays(-7)),
    sessions: sessions
      .filter((session) => !session.date.isBefore(from) && !session.date.isAfter(today))
      .sort((a, b) => b.start.getTime() - a.start.getTime()),
    steps: steps
      .filter((day) => !day.date.isBefore(from) && !day.date.isAfter(today))
      .sort((a, b) => a.date.compareTo(b.date)),
    stepsToday: steps.find((day) => day.date.epochDay === today.epochDay)?.steps,
    floors: {
      stepsPerDay: floors.stepsPerDay ?? CardioRule.stepsPerDay,
      minutesPerWeek: floors.minutesPerWeek ?? CardioRule.minutesPerWeek,
    },
    inUse: sessions.length > 0 || steps.length > 0,
  };
}
