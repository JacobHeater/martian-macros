import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { TermsAcceptance } from '../../src/domain/TermsAcceptance';
import { termsOfUse } from '../../src/terms/termsOfUse';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { CrashOnDraw } from '../../src/gallery/screens/crashOnDraw';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-679 (the owner, 2026-10-28): a crash while drawing is said in the app's own words, never a blank screen; the
 * error's own words stay off the screen; Try again draws again.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let quiet: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.preferences.saveTermsAcceptance(new TermsAcceptance({ version: termsOfUse.version, acceptedOn: today }));
  // React and the boundary both report the crash to the console; the test is about the screen.
  quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  quiet.mockRestore();
});

/** The app with `child` drawn beside its root, as the design register draws a screen. */
const drawWith = (child: ReactNode) => render(<App services={servicesOf(repos, new FixedClock(today))}>{child}</App>);

it('a screen that throws while drawing is said in words, the error kept off the screen', async () => {
  drawWith(<CrashOnDraw name="always" />);
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Something went wrong while drawing this');
  expect(alert).toHaveTextContent('Nothing you logged has been changed.');
  expect(screen.queryByText(/crashOnDraw/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  // Said to whoever debugs it.
  expect(quiet).toHaveBeenCalledWith('The app crashed while drawing.', expect.any(Error), expect.anything());
});

it('Try again draws again, and a crash that does not recur leaves the app drawn', async () => {
  drawWith(<CrashOnDraw name="retry" once />);
  await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('navigation', { name: 'Destinations' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
