import type { Workout } from '../domain/training/Workout';
import { clockTimeText } from '../format/clockTimeText';
import { elapsedText } from '../format/elapsedText';
import { spokenDuration } from '../format/spokenDuration';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmSurface } from '../ui/MmSurface';
import { useOverlays } from '../ui/useOverlays';
import { useNow } from './useNow';
import { useWorkoutController } from './useWorkoutController';
import { WorkoutTimesScreen } from './WorkoutTimesScreen';
import './train.css';

/** The clock of a workout in progress: read again every second. */
function RunningTime({ workout }: { workout: Workout }) {
  const now = useNow();
  const ms = workout.activeMs(now);
  return (
    <p className="train-clock-time" aria-label={`Workout time ${spokenDuration(ms)}`}>
      {elapsedText(ms)}
    </p>
  );
}

/**
 * How long a workout has run, or ran (MM-191): a clock that runs while it
 * is in progress and can be paused, its start, end and length once
 * finished, and the way to change them. Time paused is left out. While
 * paused the card says so and offers no button: "Resume" lives on the set
 * timer bar, so the screen has one primary way on (MM-447).
 */
export function WorkoutClockCard({ workout }: { workout: Workout }) {
  const controller = useWorkoutController();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const ended = workout.endedAt;

  /** A pause is not part of a set, so a set being timed is dropped, and the screen says so (MM-447). */
  const pause = async () => {
    const dropped = workout.setStartedAt !== undefined;
    await controller.pause(workout);
    if (dropped) overlays.snack('Paused. The set being timed was dropped; start it again after you resume.');
  };
  return (
    <MmSurface>
      <div className="train-clock">
        <div className="train-clock-text">
          {ended === undefined ? (
            <>
              <RunningTime workout={workout} />
              <p className="app-muted train-clock-line">
                {workout.paused ? 'Paused' : `Started ${clockTimeText(workout.startedAt)}`}
              </p>
            </>
          ) : (
            <>
              <p className="train-clock-time" aria-label={`Workout time ${spokenDuration(workout.activeMs(ended))}`}>
                {elapsedText(workout.activeMs(ended))}
              </p>
              <p className="app-muted train-clock-line">
                {clockTimeText(workout.startedAt)} to {clockTimeText(ended)}
              </p>
              {workout.pausedForMs > 0 ? (
                <p className="app-muted train-clock-line">Paused for {elapsedText(workout.pausedForMs)}</p>
              ) : null}
            </>
          )}
        </div>
        {ended === undefined && !workout.paused ? (
          <MmButton label="Pause" icon="pause" kind="secondary" onPress={() => void pause()} />
        ) : null}
      </div>
      <MmButton
        // Named for the workout: a set's times are edited on the set (MM-447).
        label="Edit workout times"
        kind="text"
        onPress={() => void navigator.push(() => <WorkoutTimesScreen workoutId={workout.id} />)}
      />
    </MmSurface>
  );
}
