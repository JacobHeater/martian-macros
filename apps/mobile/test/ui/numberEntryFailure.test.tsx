import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { FormatError } from '../../src/lang/FormatError';
import { NumberEntry } from '../../src/ui/NumberEntry';

/**
 * MM-303: "That value looks off" is said only when the value is refused.
 * A save that fails for another reason (storage) asks to try again, so a
 * right number is not doubted.
 */
const entry = (failure: Error) => (
  <NumberEntry title="Today’s waist" unit="in" initial={undefined} hint="How." onSave={() => Promise.reject(failure)} />
);

it('says a refused value looks off', async () => {
  render(entry(new FormatError('Not a waist measurement.')));
  await userEvent.type(screen.getByRole('textbox', { name: 'Today’s waist' }), '3{Enter}');
  expect(await screen.findByText('That value looks off. Check it.')).toBeInTheDocument();
});

it('says a save that failed for another reason can be tried again, keeping the value', async () => {
  render(entry(new Error('disk full')));
  const field = screen.getByRole('textbox', { name: 'Today’s waist' });
  await userEvent.type(field, '36{Enter}');
  expect(await screen.findByText('Could not save. Try again.')).toBeInTheDocument();
  expect(screen.queryByText('That value looks off. Check it.')).not.toBeInTheDocument();
  expect(field).toHaveValue('36');
});
