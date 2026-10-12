import { render } from '@testing-library/react';
import { App } from '../../src/app/App';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import type { SystemBars } from '../../src/platform/SystemBars';
import type { AppServices } from '../../src/state/AppServices';

/** The stores `repos` holds, with `clock`, as the app takes them. */
export function servicesOf(repos: InMemoryRepositories, clock: FixedClock): AppServices {
  return {
    clock,
    setup: repos.setup,
    weights: repos.weights,
    weightEvents: repos.weightEvents,
    waist: repos.waist,
    food: repos.food,
    customFoods: repos.customFoods,
    dayMarks: repos.dayMarks,
    intake: repos.intake,
    targets: repos.targets,
    preferences: repos.preferences,
    insightLog: repos.insightLog,
    pauses: repos.pauses,
    reminders: repos.reminders,
    recovery: repos.recovery,
    workouts: repos.workouts,
    customExercises: repos.customExercises,
    healthSamples: repos.healthSamples,
    exerciseProgressions: repos.exerciseProgressions,
    eraser: repos.eraser,
  };
}

/**
 * Draws the whole app over in-memory stores on a fixed day, as the Flutter
 * tests' `pumpApp` did. `change` may swap any of the stores for another.
 */
export function renderApp(
  repos: InMemoryRepositories = new InMemoryRepositories(),
  today: CalendarDate = CalendarDate.of(2026, 10, 10),
  { systemBars, change }: { systemBars?: SystemBars; change?: (services: AppServices) => AppServices } = {},
) {
  const clock = new FixedClock(today);
  const services = servicesOf(repos, clock);
  const view = render(<App services={change?.(services) ?? services} systemBars={systemBars} />);
  return { ...view, repos, clock, today };
}
