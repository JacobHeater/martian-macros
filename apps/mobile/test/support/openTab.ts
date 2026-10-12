import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Presses a destination in the bar at the bottom, once the shell is showing. */
export async function openTab(label: string): Promise<void> {
  const bar = await screen.findByRole('navigation', { name: 'Destinations' });
  await userEvent.click(within(bar).getByText(label));
}
