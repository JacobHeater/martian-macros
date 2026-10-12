import { useEffect } from 'react';
import type { Workout } from '../domain/training/Workout';
import { restStartedAt } from '../engine/restStartedAt';
import { restTargetMsOf } from '../engine/restTargetMsOf';
import { useApp } from '../app/useApp';

/**
 * Signals once when the rest of `workout` reaches its target (MM-191),
 * while the screen using this is showing. A rest already past its target
 * when it appears is not signalled late, and nothing is signalled while
 * the workout is paused or a set is being timed.
 */
export function useRestAlarm(workout: Workout | undefined): void {
  const { services } = useApp();
  const started = workout === undefined ? undefined : restStartedAt(workout);
  const targetMs = workout === undefined ? undefined : restTargetMsOf(workout);
  const resting =
    workout !== undefined && workout.inProgress && !workout.paused && workout.setStartedAt === undefined;
  /** When the rest now waited for reaches its target. */
  const dueMs = !resting || started === undefined || targetMs === undefined ? undefined : started.getTime() + targetMs;

  useEffect(() => {
    if (dueMs === undefined) return undefined;
    // Already over: it is shown, not signalled late.
    if (services.clock.now().getTime() >= dueMs) return undefined;
    // Asked of the app's clock a few times a second, not left to one long
    // timer: a phone slows or holds timers while its screen is off, and the
    // clock is right whenever it is next asked.
    const timer = setInterval(() => {
      if (services.clock.now().getTime() < dueMs) return;
      clearInterval(timer);
      services.restSignal.restOver();
    }, 250);
    return () => clearInterval(timer);
  }, [dueMs, services]);
}
