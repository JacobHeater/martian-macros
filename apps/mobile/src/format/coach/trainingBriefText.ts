import type { TrainingBrief } from '../../engine/analysis/TrainingBrief';
import { Fmt } from '../Fmt';
import { minutesText } from '../minutesText';

/**
 * The training end of the coach's brief (MM-681), in the coach's voice
 * (MM-617): the number, then the order. Lifting against the sessions the
 * person set; on fat loss and recomp, cardio and steps against their
 * floors (MM-678), or that no watch is counting them. Drafts the owner
 * reads on the phone.
 */
export function trainingBriefText(t: TrainingBrief): string {
  const parts: string[] = [];
  const left = t.sessionsTarget - t.sessionsThisWeek;
  if (t.sessionsThisWeek === 0 && t.daysSinceSession !== undefined && t.daysSinceSession >= 7) {
    parts.push(`No lifting in ${t.daysSinceSession} days. ${t.sessionsTarget} ${t.sessionsTarget === 1 ? 'session' : 'sessions'} a week is what you set; book the first one.`);
  } else if (t.sessionsThisWeek === 0 && t.daysSinceSession === undefined) {
    parts.push(`No lifting logged yet. ${t.sessionsTarget} ${t.sessionsTarget === 1 ? 'session' : 'sessions'} a week is what you set; log the first one.`);
  } else if (left > 0) {
    parts.push(`Lifting: ${t.sessionsThisWeek} of the ${t.sessionsTarget} sessions you set this week; ${left} to go.`);
  } else {
    parts.push(`Lifting: ${t.sessionsThisWeek} of the ${t.sessionsTarget} sessions you set this week; the week is covered.`);
  }
  if (!t.cardioHeld) return parts.join(' ');
  if (!t.wearableInUse) {
    parts.push('No watch connected: cardio and steps are not being counted. Connect one in Settings › Health.');
    return parts.join(' ');
  }
  const more = t.cardioFloorMinutes - t.cardioMinutes;
  parts.push(
    more > 0
      ? `Cardio ${minutesText(t.cardioMinutes)} against the ${minutesText(t.cardioFloorMinutes)} floor: ${minutesText(more)} more on the watch this week.`
      : `Cardio ${minutesText(t.cardioMinutes)}, over the floor.`,
  );
  if (t.stepsPerDay === undefined) {
    parts.push(`No steps counted this week against the ${Fmt.whole(t.stepsFloor)} floor.`);
  } else {
    const short = t.stepsFloor - t.stepsPerDay;
    parts.push(
      short > 0
        ? `Steps about ${Fmt.whole(t.stepsPerDay)} a day against ${Fmt.whole(t.stepsFloor)}: ${Fmt.whole(short)} more a day.`
        : `Steps about ${Fmt.whole(t.stepsPerDay)} a day, over the floor.`,
    );
  }
  return parts.join(' ');
}
