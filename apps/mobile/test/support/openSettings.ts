import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pickDate, pickTime } from './pickers';
import { topLayer } from './topLayer';

/** Opens Settings from the shell of an app already drawn, and gives the way to look things up in it. */
export async function openSettings() {
  await screen.findByRole('navigation', { name: 'Destinations' });
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  await within(topLayer()).findByRole('heading', { name: 'Settings' });
  return within(topLayer());
}

/** Gives a day to the calendar that asks for one ("2012-01-01"), and confirms it. */
export const giveDate = (value: string): Promise<void> => pickDate(value);

/** Gives a time of day to the drums that ask for one ("08:30"), and confirms it when it is allowed. */
export const giveTime = (value: string): Promise<HTMLElement> => pickTime(value);
