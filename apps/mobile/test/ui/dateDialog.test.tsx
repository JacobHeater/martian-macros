import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { MmDateDialog } from '../../src/ui/MmDateDialog';

/**
 * MM-260: the date dialog's picker indicator hugged the field's edge and
 * the dialog was one more flat surface. The stylesheet gives the phone's
 * control the palette and the indicator its distance; the dialog says the
 * day back in words, or why it cannot be taken.
 */
const props = {
  helpText: 'Date of birth',
  initial: CalendarDate.of(1996, 1, 1),
  first: CalendarDate.of(1926, 1, 1),
  last: CalendarDate.of(2008, 10, 12),
};

describe('the date dialog', () => {
  it('says the chosen day back in words', () => {
    render(<MmDateDialog {...props} onDone={() => undefined} />);
    expect(screen.getByText('January 1, 1996')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says the allowed range when the day is outside it, and OK does nothing', () => {
    let done: CalendarDate | undefined | 'untouched' = 'untouched';
    render(<MmDateDialog {...props} onDone={(date) => (done = date)} />);
    fireEvent.change(screen.getByLabelText('Date of birth', { selector: 'input' }), { target: { value: '2020-05-05' } });
    expect(screen.getByRole('alert').textContent).toBe('Choose a day between January 1, 1926 and October 12, 2008.');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(done).toBe('untouched');
  });

  it('the field draws its own chevron at the inset, and the platform draws nothing', () => {
    const { container } = render(<MmDateDialog {...props} onDone={() => undefined} />);
    const box = container.querySelector('.mm-field-box.mm-picker-box');
    expect(box).not.toBeNull();
    expect(box?.querySelector('input.mm-picker-input')).not.toBeNull();
    expect(box?.querySelector('.mm-picker-chevron svg')).not.toBeNull();
    const css = readFileSync('src/ui/ui.css', 'utf8');
    expect(css).toMatch(/\.mm-picker-input\s*\{[^}]*appearance:\s*none/);
    expect(css).toMatch(/\.mm-picker-input\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.mm-picker-input::-webkit-calendar-picker-indicator\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/\.mm-picker-input\s*\{[^}]*color-scheme:\s*dark/);
    expect(css).toMatch(/\.theme-light \.mm-picker-input\s*\{[^}]*color-scheme:\s*light/);
    expect(css).toMatch(/\.mm-dialog\s*\{[^}]*box-shadow/);
  });
});
