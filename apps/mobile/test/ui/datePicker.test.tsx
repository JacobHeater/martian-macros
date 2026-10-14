import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { MmDateDialog } from '../../src/ui/MmDateDialog';
import { MmDatePicker } from '../../src/ui/MmDatePicker';

/**
 * MM-263: a calendar of our own. No native date control anywhere; a month
 * grid with today and the chosen day marked, days outside the range quiet
 * and inert, a year list for a quick jump, and the arrows between days.
 */
const first = CalendarDate.of(1926, 1, 1);
const last = CalendarDate.of(2008, 10, 12);

function Picker({ initial = CalendarDate.of(1996, 1, 1), onRefuse }: { initial?: CalendarDate; onRefuse?: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <MmDatePicker name="Date of birth" value={value} first={first} last={last} today={CalendarDate.of(2008, 10, 12)} onChange={setValue} onRefuse={onRefuse} />
      <output>{value.toString()}</output>
    </>
  );
}

describe('the date picker', () => {
  it('renders no native control: a grid of days with the chosen one and today marked', () => {
    const { container } = render(<Picker />);
    expect(container.querySelector('input')).toBeNull();
    expect(screen.getByRole('grid', { name: 'Date of birth' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'January 1996' })).toBeInTheDocument();
    const chosen = screen.getByRole('gridcell', { name: 'January 1, 1996' });
    expect(chosen).toHaveAttribute('aria-selected', 'true');
    expect(chosen).toHaveClass('mm-day-chosen');
    expect(screen.getByRole('gridcell', { name: 'January 31, 1996' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('chooses a pressed day, and moves between months with the arrows', async () => {
    render(<Picker />);
    await userEvent.click(screen.getByRole('gridcell', { name: 'January 15, 1996' }));
    expect(screen.getByText('1996-01-15')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('button', { name: 'February 1996' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'February 29, 1996' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('button', { name: 'December 1995' })).toBeInTheDocument();
  });

  it('jumps decades through the year list', async () => {
    render(<Picker />);
    await userEvent.click(screen.getByRole('button', { name: 'January 1996' }));
    const years = screen.getByRole('listbox', { name: 'Year' });
    expect(within(years).getByRole('option', { name: /1996/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(within(years).getByRole('option', { name: '1970' }));
    expect(screen.getByRole('button', { name: 'January 1970' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'January 1, 1970' })).toBeInTheDocument();
  });

  it('keeps days outside the range quiet and inert, and says so when one is tried', async () => {
    let refused = 0;
    render(<Picker initial={CalendarDate.of(2008, 10, 1)} onRefuse={() => refused++} />);
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    const outside = screen.getByRole('gridcell', { name: 'October 13, 2008' });
    expect(outside).toHaveAttribute('aria-disabled', 'true');
    expect(outside).toHaveClass('mm-day-outside');
    await userEvent.click(outside);
    expect(refused).toBe(1);
    expect(screen.getByText('2008-10-01')).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'October 12, 2008' })).toHaveAttribute('aria-current', 'date');
  });

  it('moves between days with the arrow keys, across a month, and Enter chooses', async () => {
    render(<Picker />);
    const start = screen.getByRole('gridcell', { name: 'January 1, 1996' });
    expect(start).toHaveAttribute('tabindex', '0');
    start.focus();
    fireEvent.keyDown(start, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('gridcell', { name: 'January 2, 1996' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('gridcell', { name: 'January 9, 1996' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    // Up from the first row lands in December.
    expect(screen.getByRole('button', { name: 'December 1995' })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('gridcell', { name: 'December 25, 1995' }));
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('1995-12-25')).toBeInTheDocument();
  });

  it('a swipe across the grid turns the month', () => {
    render(<Picker />);
    const grid = screen.getByRole('grid');
    fireEvent.pointerDown(grid, { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(grid, { clientX: 100, clientY: 104 });
    expect(screen.getByRole('button', { name: 'February 1996' })).toBeInTheDocument();
  });
});

describe('the date dialog', () => {
  const props = { helpText: 'Date of birth', initial: CalendarDate.of(1996, 1, 1), first, last };

  it('says the chosen day back in words, and OK gives it', async () => {
    let done: CalendarDate | undefined;
    render(<MmDateDialog {...props} onDone={(date) => (done = date)} />);
    expect(screen.getByText('January 1, 1996')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('gridcell', { name: 'January 15, 1996' }));
    expect(screen.getByText('January 15, 1996')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(done).toBe(CalendarDate.of(1996, 1, 15));
  });

  it('says the range when a day outside it is tried, and Escape closes with nothing changed', async () => {
    let done: CalendarDate | undefined | 'untouched' = 'untouched';
    render(<MmDateDialog {...props} initial={CalendarDate.of(2008, 10, 1)} onDone={(date) => (done = date)} />);
    await userEvent.click(screen.getByRole('gridcell', { name: 'October 20, 2008' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a day between January 1, 1926 and October 12, 2008.');
    await userEvent.keyboard('{Escape}');
    expect(done).toBeUndefined();
  });

  it('is inert with an initial day outside the range, and says why', () => {
    render(<MmDateDialog {...props} initial={CalendarDate.of(2020, 5, 5)} onDone={() => undefined} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
  });
});
