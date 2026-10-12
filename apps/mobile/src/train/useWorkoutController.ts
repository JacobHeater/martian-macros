import { useMemo } from 'react';
import { WorkoutController } from '../state/WorkoutController';
import { useApp } from '../app/useApp';

/** The way to start, change and finish workouts. */
export function useWorkoutController(): WorkoutController {
  const { services } = useApp();
  return useMemo(() => new WorkoutController({ workouts: services.workouts, clock: services.clock }), [services]);
}
