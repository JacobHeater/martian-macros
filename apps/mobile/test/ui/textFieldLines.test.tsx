import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { MmTextField } from '../../src/ui/MmTextField';

/** MM-603: a text field for longer text is a text area of several lines, in the same box, label and error. */
function Note({ onSubmit }: { onSubmit?: () => void }) {
  const [value, setValue] = useState('');
  return <MmTextField label="Anything else?" lines={3} value={value} onChange={setValue} onSubmit={onSubmit} error={value === 'x' ? 'Say more.' : undefined} />;
}

it('draws a text area of the lines asked for, named by its label, with no drag handle', () => {
  render(<Note />);
  const field = screen.getByRole('textbox', { name: 'Anything else?' });
  expect(field.tagName).toBe('TEXTAREA');
  expect(field).toHaveAttribute('rows', '3');
  expect(field.closest('.mm-field-box')).toHaveClass('mm-field-box-multiline');
});

it('Enter starts a new line and submits nothing', async () => {
  const onSubmit = vi.fn();
  render(<Note onSubmit={onSubmit} />);
  const field = screen.getByRole('textbox', { name: 'Anything else?' });
  await userEvent.type(field, 'Cooked in butter{Enter}A large bowl');
  expect(field).toHaveValue('Cooked in butter\nA large bowl');
  expect(onSubmit).not.toHaveBeenCalled();
});

it('says its error as a one-line field does', async () => {
  render(<Note />);
  const field = screen.getByRole('textbox', { name: 'Anything else?' });
  await userEvent.type(field, 'x');
  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('Say more.');
});

it('one line is still an input', () => {
  render(<MmTextField label="Name" value="" onChange={() => undefined} />);
  expect(screen.getByRole('textbox', { name: 'Name' }).tagName).toBe('INPUT');
});
