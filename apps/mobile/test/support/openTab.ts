import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

/** Goes to a destination through the drawer (MM-704; the one navigation since MM-711), once the shell is showing. */
export async function openTab(label: string): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'Menu' }));
  const drawer = await screen.findByRole('dialog', { name: 'Menu' });
  const target = label === 'Progress' ? 'Coach' : label;
  await userEvent.click(within(drawer).getByRole('button', { name: target }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
}
