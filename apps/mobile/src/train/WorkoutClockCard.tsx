import type { Workout } from '../domain/training/Workout';
import { clockTimeText } from '../format/clockTimeText';
import { elapsedText } from '../format/elapsedText';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmSurface } from '../ui/MmSurface';
import { useNow } from './useNow';
import { useWorkoutController } from './useWorkoutController';
import { WorkoutTimesScreen } from './WorkoutTimesScreen';
import './train.css';

/** The clock of a workout in progress: read again every second. */
function RunningTime({ workout }: { workout: Workout }) {
  const now = useNow();
  return <p className="train-clock-time">{elapsedText(workout.activeMs(now))}</p>;
}

/**
 * How long a workout has run, or ran (MM-191): a clock that runs while it
 * is in progress and can be paused, its start, end and length once
 * finished, and the way to change them. Time paused is left out.
 */
export function WorkoutClockCard({ workout }: { workout: Workout }) {
  const controller = useWorkoutController();
  const navigator = useNavigator();
  const ended = workout.endedAt;
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
              <p className="train-clock-time">{elapsedText(workout.activeMs(ended))}</p>
              <p className="app-muted train-clock-line">
                {clockTimeText(workout.startedAt)} to {clockTimeText(ended)}
              </p>
              {workout.pausedForMs > 0 ? (
                <p className="app-muted train-clock-line">Paused for {elapsedText(workout.pausedForMs)}</p>
              ) : null}
            </>
          )}
        </div>
        {ended === undefined ? (
          <MmButton
            label={workout.paused ? 'Resume' : 'Pause'}
            icon={workout.paused ? 'play' : 'pause'}
            kind={workout.paused ? 'primary' : 'secondary'}
            onPress={() => void (workout.paused ? controller.resume(workout) : controller.pause(workout))}
          />
        ) : null}
      </div>
      <MmButton
        label="Edit times"
        kind="text"
        onPress={() => void navigator.push(() => <WorkoutTimesScreen workoutId={workout.id} />)}
      />
    </MmSurface>
  );
}
