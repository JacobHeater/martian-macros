import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Opens Coach's "Heads up" section, folded by default to its count (MM-553), once it is there. */
export async function openHeadsUp(): Promise<void> {
  const toggle = await screen.findByRole('button', { name: /^Heads up/ });
  if (toggle.getAttribute('aria-expanded') !== 'true') await userEvent.click(toggle);
}
