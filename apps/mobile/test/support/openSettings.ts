import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { topLayer } from './topLayer';

/** Opens Settings from the shell of an app already drawn, and gives the way to look things up in it. */
export async function openSettings() {
  await screen.findByRole('navigation', { name: 'Destinations' });
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  await within(topLayer()).findByRole('heading', { name: 'Settings' });
  return within(topLayer());
}

/** Gives a day to the dialog that asks for one ("2012-01-01"), and confirms it. */
export async function giveDate(value: string): Promise<void> {
  const { fireEvent } = await import('@testing-library/react');
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(dialog.querySelector('input[type="date"]') as HTMLInputElement, { target: { value } });
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
}

/** Gives a time of day to the dialog that asks for one ("08:30"), and confirms it. */
export async function giveTime(value: string): Promise<void> {
  const { fireEvent } = await import('@testing-library/react');
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(dialog.querySelector('input[type="time"]') as HTMLInputElement, { target: { value } });
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
}
