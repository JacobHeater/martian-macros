import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { MmTimeOfDayDialog } from '../../src/ui/MmTimeOfDayDialog';
import { MmTimePicker } from '../../src/ui/MmTimePicker';

/**
 * MM-264: a time picker of our own. Hour and minute as drums, AM and PM as
 * a segmented control; no native time control; the time said back in
 * words; a range refused with the range said, before OK rather than after.
 */
function Picker({ initial = 6 * 3600 + 30 * 60, everyMinute = false }: { initial?: number; everyMinute?: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <MmTimePicker value={value} onChange={setValue} everyMinute={everyMinute} />
      <output>{value}</output>
    </>
  );
}

const drum = (name: string) => screen.getByRole('spinbutton', { name });

describe('the time picker', () => {
  it('renders no native control: two drums and AM or PM', () => {
    const { container } = render(<Picker />);
    expect(container.querySelector('input')).toBeNull();
    expect(drum('Hour')).toHaveValue(6);
    expect(drum('Minute')).toHaveValue(30);
    expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers every fifth minute unless told otherwise, or the value needs every minute', () => {
    const { unmount } = render(<Picker />);
    expect(drum('Minute')).toHaveAttribute('aria-valuemax', '55');
    unmount();
    render(<Picker initial={7 * 3600 + 33 * 60} />);
    expect(drum('Minute')).toHaveAttribute('aria-valuemax', '59');
  });

  it('the arrows move a drum one step, typing sets it, and the ends clamp', () => {
    render(<Picker />);
    fireEvent.keyDown(drum('Hour'), { key: 'ArrowDown' });
    expect(drum('Hour')).toHaveValue(7);
    fireEvent.keyDown(drum('Hour'), { key: 'ArrowUp' });
    fireEvent.keyDown(drum('Hour'), { key: 'ArrowUp' });
    expect(drum('Hour')).toHaveValue(5);
    fireEvent.keyDown(drum('Hour'), { key: '1' });
    fireEvent.keyDown(drum('Hour'), { key: '2' });
    expect(drum('Hour')).toHaveValue(12);
    fireEvent.keyDown(drum('Hour'), { key: 'ArrowDown' });
    expect(drum('Hour')).toHaveValue(12);
    fireEvent.keyDown(drum('Minute'), { key: '4' });
    fireEvent.keyDown(drum('Minute'), { key: '5' });
    expect(drum('Minute')).toHaveValue(45);
    // Noon, AM: the first hour of the day.
    expect(screen.getByText(String(45 * 60))).toBeInTheDocument();
  });

  it('AM or PM moves the hour across the day, and a pressed value in the drum is chosen', async () => {
    const { container } = render(<Picker />);
    await userEvent.click(screen.getByRole('button', { name: 'PM' }));
    expect(screen.getByText(String(18 * 3600 + 30 * 60))).toBeInTheDocument();
    await userEvent.click([...container.querySelectorAll('.mm-drum-item')].find((item) => item.textContent === '9')!);
    expect(drum('Hour')).toHaveValue(9);
    expect(screen.getByText(String(21 * 3600 + 30 * 60))).toBeInTheDocument();
  });
});

describe('the time of day dialog', () => {
  it('says the time back, and OK gives minutes after midnight', async () => {
    let done: number | undefined;
    render(<MmTimeOfDayDialog initialMinuteOfDay={6 * 60 + 30} helpText="Weigh-in reminder" onDone={(minute) => (done = minute)} />);
    expect(screen.getByText('6:30 AM')).toBeInTheDocument();
    fireEvent.keyDown(drum('Hour'), { key: '7' });
    expect(screen.getByText('7:30 AM')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(done).toBe(7 * 60 + 30);
  });

  it('refuses a time outside the range with the range said, and OK does nothing', async () => {
    let done: number | undefined | 'untouched' = 'untouched';
    render(
      <MmTimeOfDayDialog
        initialMinuteOfDay={8 * 60}
        helpText="Weigh-in reminder"
        first={7 * 60}
        last={21 * 60 - 1}
        onDone={(minute) => (done = minute)}
      />,
    );
    fireEvent.keyDown(drum('Hour'), { key: '1' });
    fireEvent.keyDown(drum('Hour'), { key: '0' });
    await userEvent.click(screen.getByRole('button', { name: 'PM' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a time between 7:00 AM and 8:59 PM.');
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    expect(drum('Hour')).toHaveValue(10);
    await userEvent.keyboard('{Escape}');
    expect(done).toBeUndefined();
  });
});
