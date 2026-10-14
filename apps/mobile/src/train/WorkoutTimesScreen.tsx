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

  /** Keeps the change if it makes sense; says why not otherwise. */
  const change = async ({ date, startedAt, endedAt }: { date?: CalendarDate; startedAt?: Date; endedAt?: Date }) => {
    const start = startedAt ?? workout.startedAt;
    const end = endedAt ?? workout.endedAt;
    const problem = checkTimeSpan({ start, end, notAfter: services.clock.now() });
    if (problem !== undefined) {
      overlays.snack(problem === 'tooLate' ? 'A workout cannot be in the future.' : timeSpanProblemMessage(problem));
      return;
    }
    await controller.setTimes(workout, { date: date ?? workout.date, startedAt: start, endedAt: end });
  };

  const pickTime = async (current: Date, help: string) => {
    const minutes = await overlays.timeOfDay({
      initialMinuteOfDay: current.getHours() * 60 + current.getMinutes(),
      helpText: help,
    });
    if (minutes === undefined) return undefined;
    return new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, minutes);
  };

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
    const picked = await pickTime(workout.startedAt, 'Started');
    if (picked !== undefined) await change({ startedAt: picked });
  };

  const pickEnd = async (current: Date) => {
    const picked = await pickTime(current, 'Ended');
    if (picked === undefined) return;
    // A time of day before the start is after midnight, on the next day,
    // when that is not still to come.
    await change({
      endedAt: placeTimeOfDay({
        notBefore: workout.startedAt,
        notAfter: services.clock.now(),
        timeOfDayMs: (picked.getHours() * 60 + picked.getMinutes()) * 60000,
      }),
    });
  };

  return (
    <Screen title="Workout times">
      <MmListGroup>
        <MmListRow title="Day" subtitle={Fmt.day(workout.date, today)} opens onPress={() => void pickDay()} />
        <MmListRow
          title="Started"
          subtitle={clockTimeText(workout.startedAt)}
          opens
          onPress={() => void pickStart()}
        />
        {ended === undefined ? null : (
          <MmListRow
            title="Ended"
            subtitle={
              daysOn(workout.startedAt, ended) > 0 ? `${clockTimeText(ended)}, next day` : clockTimeText(ended)
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
            onPress={() => void controller.restartClock(workout)}
          />
        </>
      ) : null}
    </Screen>
  );
}
