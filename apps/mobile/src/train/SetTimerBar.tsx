import type { Workout } from '../domain/training/Workout';
import { restStartedAt } from '../engine/restStartedAt';
import { restTargetMsOf } from '../engine/restTargetMsOf';
import { elapsedText } from '../format/elapsedText';
import { spokenDuration } from '../format/spokenDuration';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmButton } from '../ui/MmButton';
import { setDoneIndex } from './setDoneIndex';
import { useAddSet } from './useAddSet';
import { useNow } from './useNow';
import { useWorkoutController } from './useWorkoutController';
import './train.css';

/**
 * The set and rest timer of a workout in progress (MM-191), always in
 * reach at the bottom of the screen. "Start set" starts timing a set;
 * "Set done" here, or an exercise's "Add set", records it with its start
 * and end, so the control that ends a set is always on screen (MM-222).
 * From then the rest is counted, until the next set is started: up, or
 * down to the target rest of the exercise just done, and up again once
 * that is reached.
 */
export function SetTimerBar({ workout }: { workout: Workout }) {
  const { state } = useApp();
  const controller = useWorkoutController();
  const addSet = useAddSet(workout);
  const exercises = useCell(state.exercisesById);
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
  // The exercise "Set done" records on, named so it is not a guess (MM-222).
  const target = setDoneIndex(workout);
  const targetId = target === undefined ? undefined : workout.exercises[target]?.exerciseId;
  const targetName = targetId === undefined ? undefined : (exercises.get(targetId)?.name ?? 'Deleted exercise');
  // Every instruction names a button on this bar (MM-222).
  let instruction: string | undefined;
  if (targetName === undefined) instruction = 'Add an exercise to time a set.';
  else if (setStarted !== undefined && !workout.paused) instruction = `Tap Set done to record it on ${targetName}.`;

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
        {instruction === undefined ? null : <p className="train-timer-label">{instruction}</p>}
      </div>
      {setStarted === undefined ? (
        <MmButton
          label="Start set"
          kind="primary"
          // Nothing is timed while the workout is paused, or before it has an exercise to record on (MM-222).
          onPress={workout.paused || target === undefined ? undefined : () => void controller.startSet(workout)}
        />
      ) : (
        <>
          <MmButton label="Cancel" kind="text" onPress={workout.paused ? undefined : () => void controller.cancelSet(workout)} />
          <MmButton
            label="Set done"
            kind="primary"
            onPress={workout.paused || target === undefined ? undefined : () => void addSet(target)}
          />
        </>
      )}
    </div>
  );
}
