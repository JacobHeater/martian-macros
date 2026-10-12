import { render } from '@testing-library/react';
import { App } from '../../src/app/App';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import type { SystemBars } from '../../src/platform/SystemBars';
import type { AppServices } from '../../src/state/AppServices';
import { servicesOf } from './servicesOf';

/**
 * Draws the whole app over in-memory stores on a fixed day, as the Flutter
 * tests' `pumpApp` did. `change` may swap any of the stores for another.
 */
export function renderApp(
  repos: InMemoryRepositories = new InMemoryRepositories(),
  today: CalendarDate = CalendarDate.of(2026, 10, 10),
  {
    systemBars,
    change,
    hour,
    clock: given,
  }: {
    systemBars?: SystemBars;
    change?: (services: AppServices) => AppServices;
    hour?: number;
    /** A clock already running, for an app opened again later the same day. */
    clock?: FixedClock;
  } = {},
) {
  const clock = given ?? new FixedClock(today, hour === undefined ? {} : { hour });
  const services = servicesOf(repos, clock);
  const view = render(<App services={change?.(services) ?? services} systemBars={systemBars} />);
  return { ...view, repos, clock, today };
}
