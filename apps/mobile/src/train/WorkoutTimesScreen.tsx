import { CalendarDate } from '../domain/CalendarDate';
import { checkTimeSpan } from '../engine/checkTimeSpan';
import { placeTimeOfDay } from '../engine/placeTimeOfDay';
import { clockTimeText } from '../format/clockTimeText';
import { Fmt } from '../format/Fmt';
import { timeSpanProblemMessage } from '../format/timeSpanProblemMessage';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { useWorkoutController } from './useWorkoutController';

/** The time of day of `time`, on `date` or some days after it. */
const on = (date: CalendarDate, time: Date, addDays = 0) =>
  new Date(date.year, date.month - 1, date.day + addDays, time.getHours(), time.getMinutes(), time.getSeconds());

/** How many days after its start a workout ended: 1 for one that ran past midnight. */
const daysOn = (start: Date, end: Date) => CalendarDate.fromDate(end).epochDay - CalendarDate.fromDate(start).epochDay;

/**
 * Setting a workout's day, start and end by hand (MM-191): for one logged
 * afterwards, or whose clock was left running.
 */
export function WorkoutTimesScreen({ workoutId }: { workoutId: number }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const controller = useWorkoutController();
  const workouts = useLoaded(state.workouts) ?? [];
  const today = useCell(state.today);
  const workout = workouts.find((w) => w.id === workoutId);
  if (workout === undefined) return <Screen title="Workout times">{null}</Screen>;
  const ended = workout.endedAt;

  /** Moves the workout's start to now, once asked: it cannot be taken back (MM-447). */
  const restart = async () => {
    const sure = await overlays.confirm({
      title: 'Start the clock again from now?',
      message: 'The workout’s start moves to now and its paused time is cleared. Sets already logged are kept.',
      confirmLabel: 'Start again',
    });
    if (sure) await controller.restartClock(workout);
  };

  /** Why a start and an end cannot be the workout's, or undefined if they can. */
  const refusal = (start: Date, end: Date | undefined) => {
    const problem = checkTimeSpan({ start, end, notAfter: services.clock.now() });
    if (problem === undefined) return undefined;
    return problem === 'tooLate' ? 'A workout cannot be in the future.' : timeSpanProblemMessage(problem);
  };

  /** Keeps the change if it makes sense; says why not otherwise. */
  const change = async ({ date, startedAt, endedAt }: { date?: CalendarDate; startedAt?: Date; endedAt?: Date }) => {
    const start = startedAt ?? workout.startedAt;
    const end = endedAt ?? workout.endedAt;
    const problem = refusal(start, end);
    if (problem !== undefined) {
      overlays.snack(problem);
      return;
    }
    await controller.setTimes(workout, { date: date ?? workout.date, startedAt: start, endedAt: end });
  };

  /**
   * Asks for a time of day to the second, as a set's times are (MM-191).
   * `place` says which moment a time of day means; one that cannot be the
   * workout's is refused inside the clock, so what was chosen stays on it
   * (MM-222).
   */
  const pickTime = (
    title: string,
    current: Date,
    place: (timeOfDayMs: number) => Date,
    refuseAt: (picked: Date) => string | undefined,
  ) =>
    overlays.clockTime({
      title,
      initialMs: (current.getHours() * 3600 + current.getMinutes() * 60 + current.getSeconds()) * 1000,
      refuse: (ms) => refuseAt(place(ms)),
    });

  const pickDay = async () => {
    const date = await overlays.date({
      helpText: 'Day of the workout',
      initial: workout.date,
      first: CalendarDate.of(today.year - 5, 1, 1),
      last: today,
      today,
    });
    if (date === undefined) return;
    // The times of day stay; the day they are on moves.
    await change({
      date,
      startedAt: on(date, workout.startedAt),
      // An end after midnight stays on the day after.
      ...(ended === undefined ? {} : { endedAt: on(date, ended, daysOn(workout.startedAt, ended)) }),
    });
  };

  const pickStart = async () => {
    const current = workout.startedAt;
    // The start stays on its day.
    const place = (timeOfDayMs: number) =>
      new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, Math.trunc(timeOfDayMs / 1000));
    const picked = await pickTime('Started', current, place, (start) => refusal(start, workout.endedAt));
    if (picked !== undefined) await change({ startedAt: place(picked) });
  };

  const pickEnd = async (current: Date) => {
    // A time of day before the start is after midnight, on the next day,
    // when that is not still to come.
    const place = (timeOfDayMs: number) =>
      placeTimeOfDay({ notBefore: workout.startedAt, notAfter: services.clock.now(), timeOfDayMs });
    const picked = await pickTime('Ended', current, place, (end) => refusal(workout.startedAt, end));
    if (picked !== undefined) await change({ endedAt: place(picked) });
  };

  return (
    <Screen title="Workout times">
      <MmListGroup>
        <MmListRow title="Day" subtitle={Fmt.day(workout.date, today)} opens onPress={() => void pickDay()} />
        <MmListRow
          title="Started"
          subtitle={clockTimeText(workout.startedAt, { seconds: true })}
          opens
          onPress={() => void pickStart()}
        />
        {ended === undefined ? null : (
          <MmListRow
            title="Ended"
            subtitle={
              daysOn(workout.startedAt, ended) > 0
                ? `${clockTimeText(ended, { seconds: true })}, next day`
                : clockTimeText(ended, { seconds: true })
            }
            opens
            onPress={() => void pickEnd(ended)}
          />
        )}
      </MmListGroup>
      {workout.inProgress ? (
        <>
          <div className="app-gap" />
          <MmButton
            label="Start the clock again from now"
            kind="secondary"
            expand
            onPress={() => void restart()}
          />
        </>
      ) : null}
    </Screen>
  );
}
