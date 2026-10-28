import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { openTab } from './openTab';

/**
 * Opens the Coach tab with every fold on it open (MM-676: they all start
 * closed), as a person reading the whole tab would. Only the tab's own
 * folds are opened; a fold inside the body fold (Waist, Sleep, Strength
 * trends, Weight events, More measurements) is left as it starts, so a test
 * of one of those opens it as before.
 */
export async function openCoach(): Promise<void> {
  await openTab('Coach');
  const body = () => document.querySelector('.app-body') as HTMLElement;
  const closed = () =>
    [...body().querySelectorAll(':scope > .mm-section > .mm-section-head button[aria-expanded="false"]')] as HTMLElement[];
  // The tab first; its folds draw as the coach reads its records, so the passes below go round more than once.
  await screen.findByRole('heading', { level: 1, name: 'Coach' });
  // A fold drawn after a read (the reports, a review) is opened on a later pass: at least two, a breath apart.
  for (let pass = 0; pass < 5; pass += 1) {
    for (const header of closed()) await userEvent.click(header);
    await waitFor(() => expect(within(body()).queryAllByRole('progressbar', { name: 'Loading' })).toHaveLength(0)).catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (pass >= 1 && closed().length === 0) break;
  }
}
