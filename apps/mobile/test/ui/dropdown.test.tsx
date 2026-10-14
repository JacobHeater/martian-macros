import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MmDropdown } from '../../src/ui/MmDropdown';
import { MmOverlays } from '../../src/ui/MmOverlays';

/**
 * MM-265: a select that is ours. No `<select>`: a field with the value in
 * words that opens the options list, the current one marked Chosen.
 */
const items = [
  { value: 'illness', label: 'Illness' },
  { value: 'travel', label: 'Travel' },
  { value: 'creatine', label: 'Creatine' },
] as const;

function Field({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState<string>('travel');
  return (
    <MmOverlays>
      <MmDropdown label="Event" value={value} items={items} onChange={disabled ? undefined : setValue} />
      <output>{value}</output>
    </MmOverlays>
  );
}

describe('the dropdown', () => {
  it('renders no native select: a field with the value in words', () => {
    const { container } = render(<Field />);
    expect(container.querySelector('select')).toBeNull();
    const field = screen.getByRole('button', { name: /^Event/ });
    expect(field).toHaveAccessibleName('Event Travel');
    expect(field).toHaveAttribute('aria-haspopup', 'listbox');
    expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the options list with the current value marked Chosen, and takes the one pressed', async () => {
    render(<Field />);
    await userEvent.click(screen.getByRole('button', { name: /^Event/ }));
    const dialog = screen.getByRole('dialog', { name: 'Event' });
    expect(screen.getByRole('button', { name: /^Event/ })).toHaveAttribute('aria-expanded', 'true');
    const current = within(dialog).getByRole('option', { name: /Travel/ });
    expect(current).toHaveAttribute('aria-selected', 'true');
    expect(within(current).getByText('Chosen')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('option', { name: 'Creatine' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('creatine')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Event/ })).toHaveAccessibleName('Event Creatine');
  });

  it('cancelled, keeps its value', async () => {
    render(<Field />);
    await userEvent.click(screen.getByRole('button', { name: /^Event/ }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('travel')).toBeInTheDocument();
  });

  it('with no action is drawn quiet, the value readable, and pressing it does nothing', async () => {
    render(<Field disabled />);
    const field = screen.getByRole('button', { name: /^Event/ });
    expect(field).toBeDisabled();
    expect(field).toHaveTextContent('Travel');
    await userEvent.click(field);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
