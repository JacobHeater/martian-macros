import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pickDate, pickTime } from './pickers';
import { topLayer } from './topLayer';

/**
 * Opens Settings from the shell of an app already drawn, and gives the way
 * to look things up in it. Settings' sections start closed (MM-398); most
 * tests are about the rows, so every section is opened unless `closed`.
 */
export async function openSettings({ closed = false }: { closed?: boolean } = {}) {
  await screen.findByRole('navigation', { name: 'Destinations' });
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  const settings = within(topLayer());
  await settings.findByRole('heading', { name: 'Settings' });
  // Erase is the last section: once it is drawn, the sections that wait for nothing are too.
  await settings.findByRole('heading', { level: 2, name: 'Erase' });
  if (!closed) await openEverySection();
  return settings;
}

/** Opens every closed section of Settings; a section drawn later (Health Connect, once read) is opened again. */
export async function openEverySection(): Promise<void> {
  for (const header of within(topLayer()).queryAllByRole('button', { expanded: false })) {
    if (header.closest('.mm-section-heading') !== null) await userEvent.click(header);
  }
}

/** Gives a day to the calendar that asks for one ("2012-01-01"), and confirms it. */
export const giveDate = (value: string): Promise<void> => pickDate(value);

/** Gives a time of day to the drums that ask for one ("08:30"), and confirms it when it is allowed. */
export const giveTime = (value: string): Promise<HTMLElement> => pickTime(value);
