import type { TrainingBrief } from '../../engine/analysis/TrainingBrief';
import { Fmt } from '../Fmt';
import { minutesText } from '../minutesText';
import { countWord } from './countWord';
import { sentenceCase } from './sentenceCase';

/**
 * The training end of the coach's brief (MM-681), in the owner's shape
 * (MM-693, MM-711): one line, one order, at most one number, lifting
 * first. The week's rows stand under the words, so nothing is recited:
 * lifting behind is the line; lifting covered, cardio short is; both
 * covered, steps short is; all covered, one sentence says so. On
 * maintenance only the lifting is held; on a cut without a watch, that
 * nothing is being counted.
 */
export function trainingBriefText(t: TrainingBrief): string {
  const left = t.sessionsTarget - t.sessionsThisWeek;
  if (t.sessionsThisWeek === 0 && t.daysSinceSession !== undefined && t.daysSinceSession >= 7) return `No lift in ${t.daysSinceSession} days: book one tonight.`;
  if (t.sessionsThisWeek === 0) return `Zero lifts of the ${countWord(t.sessionsTarget)} you set this week: book one tonight.`;
  if (left > 0) return `${sentenceCase(countWord(t.sessionsThisWeek))} of the ${countWord(t.sessionsTarget)} lifts you set ${t.sessionsThisWeek === 1 ? 'is' : 'are'} in: ${countWord(left)} to go this week.`;
  if (!t.cardioHeld) return 'Lifting is covered this week.';
  if (!t.wearableInUse) return 'Lifting is covered; no watch is connected, so cardio and steps are not being counted.';
  const more = t.cardioFloorMinutes - t.cardioMinutes;
  if (more > 0) return `Lifting is covered; cardio is ${minutesText(more)} short of the floor this week: get it on the watch.`;
  if (t.stepsPerDay === undefined) return 'Lifting and cardio are covered; no steps were counted this week.';
  const short = t.stepsFloor - t.stepsPerDay;
  if (short > 0) return `Lifting and cardio are covered; steps are ${Fmt.whole(short)} a day under the floor: walk more.`;
  return 'Training is covered this week: lifting, cardio and steps.';
}
