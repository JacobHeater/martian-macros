import type { Workout } from '../domain/training/Workout';
import { restStartedAt } from '../engine/restStartedAt';
import { restTargetMsOf } from '../engine/restTargetMsOf';
import { elapsedText } from '../format/elapsedText';
import { spokenDuration } from '../format/spokenDuration';
import { MmButton } from '../ui/MmButton';
import { useNow } from './useNow';
import { useWorkoutController } from './useWorkoutController';
import './train.css';

/**
 * The set and rest timer of a workout in progress (MM-191), always in
 * reach at the bottom of the screen. "Start set" starts timing a set;
 * adding the set stops it and gives the set its start and end. From then
 * the rest is counted, until the next set is started: up, or down to the
 * target rest of the exercise just done, and up again once that is reached.
 */
export function SetTimerBar({ workout }: { workout: Workout }) {
  const controller = useWorkoutController();
  const now = useNow();
  const setStarted = workout.setStartedAt;
  const restStarted = restStartedAt(workout);
  const since = setStarted ?? restStarted;
  const targetMs = setStarted === undefined ? restTargetMsOf(workout) : undefined;

  const counting = since !== undefined && !workout.paused;
  const elapsedMs = counting ? now.getTime() - since.getTime() : 0;
  const leftMs = counting && targetMs !== undefined ? targetMs - elapsedMs : undefined;
  const down = leftMs !== undefined && leftMs > 0;
  const shownMs = down ? leftMs : elapsedMs;
  const aim = targetMs === undefined ? '' : ` · ${elapsedText(targetMs)} target`;
  let label: string;
  if (workout.paused) label = 'Paused';
  else if (setStarted !== undefined) label = 'Set';
  else if (restStarted === undefined) label = 'Set timer';
  else if (leftMs === undefined) label = 'Rest';
  else label = down ? `Rest left${aim}` : `Target rest reached${aim}`;

  return (
    <div className="train-timer">
      <div className="train-timer-text">
        {/* Said once when it changes; the figure under it changes every second and is read only when asked for. */}
        <p className="train-timer-label" aria-live="polite">
          {label}
        </p>
        <p className="train-timer-time" aria-label={down ? `${spokenDuration(shownMs)} left` : spokenDuration(shownMs)}>
          {elapsedText(shownMs)}
        </p>
        {setStarted === undefined ? null : <p className="train-timer-label">Tap Add set when the set is done.</p>}
      </div>
      <MmButton
        label={setStarted === undefined ? 'Start set' : 'Cancel'}
        kind={setStarted === undefined ? 'primary' : 'secondary'}
        // Nothing is timed while the workout is paused.
        onPress={
          workout.paused
            ? undefined
            : () => void (setStarted === undefined ? controller.startSet(workout) : controller.cancelSet(workout))
        }
      />
    </div>
  );
}
