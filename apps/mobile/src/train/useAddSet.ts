import type { Workout } from '../domain/training/Workout';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { previousSetsOf } from '../engine/previousSetsOf';
import { suggestProgression } from '../engine/suggestProgression';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useWorkoutController } from './useWorkoutController';

/**
 * The way to record the next set of the exercise at an index of `workout`
 * (MM-75), from an exercise's "Add set" or the timer bar's "Set done"
 * (MM-222): a copy of the set before, or for the first set the suggestion
 * (MM-79), or else last time's first set.
 */
export function useAddSet(workout: Workout): (index: number) => Promise<void> {
  const { state } = useApp();
  const controller = useWorkoutController();
  const exercises = useCell(state.exercisesById);
  const setup = useLoaded(state.setup);
  const workouts = useLoaded(state.workouts) ?? [];
  const progressions = useLoaded(state.exerciseProgressions);
  return (index) => {
    const entry = workout.exercises[index];
    if (entry === undefined) return Promise.resolve();
    const exercise = exercises.get(entry.exerciseId);
    const lastTime = previousSetsOf({ exerciseId: entry.exerciseId, workouts, before: workout.startedAt });
    // Suggested while training, not on a workout being looked back at.
    const suggestion = !workout.inProgress
      ? undefined
      : suggestProgression({
          exerciseId: entry.exerciseId,
          exercise,
          workouts,
          before: workout.startedAt,
          goal: setup?.goalMode ?? 'maintenance',
          units: setup?.unitSystem ?? 'imperial',
          settings: progressions?.get(entry.exerciseId),
        });
    return controller.addSet(workout, index, {
      lastTime:
        suggestion === undefined ? lastTime[0] : new WorkoutSet({ reps: suggestion.reps, loadKg: suggestion.loadKg }),
    });
  };
}
