import { render } from '@testing-library/react';
import { App } from '../../src/app/App';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { TermsAcceptance } from '../../src/domain/TermsAcceptance';
import { termsOfUse } from '../../src/terms/termsOfUse';
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
    terms = 'agreed',
  }: {
    systemBars?: SystemBars;
    change?: (services: AppServices) => AppServices;
    hour?: number;
    /** A clock already running, for an app opened again later the same day. */
    clock?: FixedClock;
    /** Whether the terms of use were agreed to before the app opens (MM-242). A test of the terms says 'unanswered'. */
    terms?: 'agreed' | 'unanswered';
  } = {},
) {
  const clock = given ?? new FixedClock(today, hour === undefined ? {} : { hour });
  // The in-memory store takes this at once, so it is there before the first draw.
  if (terms === 'agreed') {
    void repos.preferences.saveTermsAcceptance(new TermsAcceptance({ version: termsOfUse.version, acceptedOn: today }));
  }
  const services = servicesOf(repos, clock);
  const view = render(<App services={change?.(services) ?? services} systemBars={systemBars} />);
  return { ...view, repos, clock, today };
}
