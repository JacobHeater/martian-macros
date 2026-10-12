import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import type { UserSetup } from '../domain/UserSetup';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { pauseOn } from './pauseOn';
import type { ReliefOffer } from './ReliefOffer';
import { ReliefRule } from './ReliefRule';
import { slowerPace } from './slowerPace';
import type { TargetsRecord } from './TargetsRecord';

const hard = (checkIn: RecoveryCheckIn) =>
  RecoveryQuestion.values.filter((q) => checkIn.answer(q) <= ReliefRule.hardAnswer).length >=
  ReliefRule.hardAnswersPerCheckIn;

/**
 * The offer to ease a deficit, if one is due on `today` (MM-117).
 *
 * Made only on a deficit goal whose current targets are a deficit, when
 * each of the last two weekly check-ins (MM-116) had at least three of its
 * five answers at the hard end. Not during a pause, and not for three weeks
 * after the user last answered it.
 *
 * The strength trigger of MM-117 needs the training log and is not here.
 * Nothing this returns can lower calories or ask for more exercise: the
 * choices are a maintenance week, a slower pace, or carrying on.
 */
export function findReliefOffer({
  setup,
  checkIns,
  history,
  today,
  deficitRestartOn,
  pauses = [],
}: {
  setup: UserSetup;
  checkIns: readonly RecoveryCheckIn[];
  history: readonly TargetsRecord[];
  today: CalendarDate;
  deficitRestartOn?: CalendarDate | undefined;
  pauses?: Iterable<Pause>;
}): ReliefOffer | undefined {
  if (setup.goalMode !== 'fatLoss' && setup.goalMode !== 'recomp') {
    return undefined;
  }
  const current = history[history.length - 1];
  if (current === undefined || current.targets.weeklyRateFraction >= 0) {
    return undefined;
  }
  if (pauseOn(pauses, today) !== undefined) return undefined;
  const answered = setup.reliefAnsweredOn;
  if (answered !== undefined && !answered.isAfter(today) && answered.daysUntil(today) < ReliefRule.quietDays) {
    return undefined;
  }

  const sorted = checkIns.filter((c) => !c.date.isAfter(today)).sort((a, b) => a.date.compareTo(b.date));
  if (sorted.length < ReliefRule.hardCheckInsRunning) return undefined;
  const recent = sorted.slice(sorted.length - ReliefRule.hardCheckInsRunning);
  const latest = recent[recent.length - 1] as RecoveryCheckIn;
  if (latest.date.daysUntil(today) >= ReliefRule.freshDays) return undefined;
  for (let i = 1; i < recent.length; i++) {
    const apart = (recent[i - 1] as RecoveryCheckIn).date.daysUntil((recent[i] as RecoveryCheckIn).date);
    if (apart > ReliefRule.consecutiveWithinDays || apart < ReliefRule.apartDays) {
      return undefined;
    }
  }
  if (!recent.every(hard)) return undefined;

  const weeks = consecutiveDeficitWeeks(history, today, { restartOn: deficitRestartOn });
  const slower = setup.goalMode === 'fatLoss' ? slowerPace(setup.requestedLossFraction) : undefined;
  const hours: number[] = [];
  for (const c of recent) {
    if (c.sleepHours !== undefined) hours.push(c.sleepHours);
  }
  return {
    suggestion: slower === undefined || weeks >= ReliefRule.breakFromDeficitWeeks ? 'maintenanceWeek' : 'slowerPace',
    slowerPace: slower,
    deficitWeeks: weeks,
    shortSleep: hours.length > 0 && hours.reduce((a, b) => a + b) / hours.length < ReliefRule.shortSleepHours,
  };
}
