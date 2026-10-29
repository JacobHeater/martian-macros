import { render, screen, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { startApp } from '../../src/app/startApp';
import type { AppServices } from '../../src/state/AppServices';

/**
 * MM-694 (the owner's phone, 2026-10-29): a start whose data cannot be opened says so in the app's own words with
 * Try again, which opens again and draws the app when that succeeds; the error's own words stay off the screen
 * (MM-333). Before the fix the screen was plain text that only said to close the app.
 */
let view: RenderResult | undefined;
let quiet: ReturnType<typeof vi.spyOn>;
const services = {} as AppServices;
const show = (node: ReactNode) => {
  if (view === undefined) view = render(<>{node}</>);
  else view.rerender(<>{node}</>);
};
const draw = async () => <p>The app, drawn</p>;

beforeEach(() => {
  view = undefined;
  // The failure is reported to the console on purpose; the test is about the screen.
  quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  quiet.mockRestore();
});

it('an opening that fails is said as a failed read, with Try again, and the error’s words stay off the screen', async () => {
  const locked = new Error('unable to open database file');
  await startApp({ render: show, open: () => Promise.reject(locked), draw });
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Could not open your data');
  expect(alert).toHaveTextContent('Nothing you logged has been changed.');
  expect(alert).toHaveTextContent('If this keeps happening, close the app and open it again.');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('unable to open database file');
  expect(quiet).toHaveBeenCalledWith(locked);
});

it('Try again opens the data again, says it is trying meanwhile, and draws the app once that succeeds', async () => {
  let release: (services: AppServices) => void = () => undefined;
  const open = vi
    .fn<() => Promise<AppServices>>()
    .mockRejectedValueOnce(new Error('unable to open database file'))
    .mockImplementationOnce(() => new Promise<AppServices>((resolve) => {
          release = resolve;
        }));
  await startApp({ render: show, open, draw });
  await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('button', { name: 'Trying…' })).toBeInTheDocument();
  release(services);
  expect(await screen.findByText('The app, drawn')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(open).toHaveBeenCalledTimes(2);
});

it('a second failure says so again, ready to try once more', async () => {
  const open = vi
    .fn<() => Promise<AppServices>>()
    .mockRejectedValueOnce(new Error('unable to open database file'))
    .mockRejectedValueOnce(new Error('unable to open database file'))
    .mockResolvedValueOnce(services);
  await startApp({ render: show, open, draw });
  await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('The app, drawn')).toBeInTheDocument();
  expect(open).toHaveBeenCalledTimes(3);
});
