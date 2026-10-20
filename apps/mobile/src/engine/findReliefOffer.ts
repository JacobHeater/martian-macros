import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../domain/RecoveryQuestion';
import type { UserSetup } from '../domain/UserSetup';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { pauseOn } from './pauseOn';
import type { ReliefOffer } from './ReliefOffer';
import { ReliefRule } from './ReliefRule';
import type { ReliefSignal } from './ReliefSignal';
import { shortSleep } from './shortSleep';
import type { SleepAverage } from './SleepAverage';
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
 * Short sleep is a signal of its own (MM-252): an average under six hours
 * over the last fourteen recorded nights makes the offer whether or not the
 * check-ins were hard. The strength trigger of MM-117 needs the training log
 * and is not here. Nothing this returns can lower calories or ask for more
 * exercise: the choices are a maintenance week, a slower pace, or carrying on.
 */
export function findReliefOffer({
  setup,
  checkIns,
  history,
  today,
  deficitRestartOn,
  pauses = [],
  sleepAverage,
}: {
  setup: UserSetup;
  checkIns: readonly RecoveryCheckIn[];
  history: readonly TargetsRecord[];
  today: CalendarDate;
  deficitRestartOn?: CalendarDate | undefined;
  pauses?: Iterable<Pause>;
  /** The fourteen-night average from the nights recorded (MM-250); undefined with none. */
  sleepAverage?: SleepAverage | undefined;
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

  const recent = hardWeeks(checkIns, today);
  const sleepIsShort = shortSleep(sleepAverage);
  const signals: ReliefSignal[] = [];
  if (recent !== undefined) signals.push('hardCheckIns');
  if (sleepIsShort) signals.push('shortSleep');
  if (signals.length === 0) return undefined;

  const weeks = consecutiveDeficitWeeks(history, today, { restartOn: deficitRestartOn });
  const slower = setup.goalMode === 'fatLoss' ? slowerPace(setup.requestedLossFraction) : undefined;
  // With no record of nights, the hours typed at the hard check-ins stand in for the line.
  const hours: number[] = [];
  for (const c of recent ?? []) {
    if (c.sleepHours !== undefined) hours.push(c.sleepHours);
  }
  const typedShort =
    sleepAverage === undefined && hours.length > 0 && hours.reduce((a, b) => a + b) / hours.length < ReliefRule.shortSleepHours;
  return {
    suggestion: slower === undefined || weeks >= ReliefRule.breakFromDeficitWeeks ? 'maintenanceWeek' : 'slowerPace',
    slowerPace: slower,
    deficitWeeks: weeks,
    signals,
    shortSleep: sleepIsShort || typedShort,
    sleepAverage: sleepIsShort ? sleepAverage : undefined,
  };
}

/**
 * The last two weekly check-ins, when each had most answers at the hard end,
 * the latest is fresh and they are a week or two apart (MM-117); undefined otherwise.
 */
function hardWeeks(checkIns: readonly RecoveryCheckIn[], today: CalendarDate): readonly RecoveryCheckIn[] | undefined {
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
  return recent.every(hard) ? recent : undefined;
}
