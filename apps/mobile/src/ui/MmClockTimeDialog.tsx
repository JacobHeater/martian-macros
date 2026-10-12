import { useState } from 'react';
import { tryParseInt } from '../lang/tryParseInt';
import { MmButton } from './MmButton';
import { MmDialog } from './MmDialog';
import { MmSegmented } from './MmSegmented';
import { MmTextField } from './MmTextField';
import './ui.css';

interface MmClockTimeDialogProps {
  title: string;
  /** The time it opens on, in milliseconds after midnight. */
  initialMs: number;
  /** Called with the time in milliseconds after midnight, or undefined when backed out of. */
  onDone: (timeMs: number | undefined) => void;
}

const two = (n: number) => String(n).padStart(2, '0');

/**
 * Asks for a time of day to the second: hour, minute and second, each a
 * number (Hour, Min, Sec: short enough to fit a phone), and AM or PM.
 */
export function MmClockTimeDialog({ title, initialMs, onDone }: MmClockTimeDialogProps) {
  const initialSeconds = Math.trunc(initialMs / 1000);
  const initialHour = Math.trunc(initialSeconds / 3600) % 24;
  const [hour, setHour] = useState(`${initialHour % 12 === 0 ? 12 : initialHour % 12}`);
  const [minute, setMinute] = useState(two(Math.trunc(initialSeconds / 60) % 60));
  const [second, setSecond] = useState(two(initialSeconds % 60));
  const [pm, setPm] = useState(initialHour >= 12);
  const [error, setError] = useState<string>();

  const confirm = () => {
    const h = tryParseInt(hour);
    const m = tryParseInt(minute);
    // An empty seconds field is the top of the minute.
    const s = second.trim() === '' ? 0 : tryParseInt(second);
    if (h === undefined || h < 1 || h > 12) return setError('The hour is from 1 to 12.');
    if (m === undefined || m < 0 || m > 59) return setError('The minute is from 0 to 59.');
    if (s === undefined || s < 0 || s > 59) return setError('The second is from 0 to 59.');
    return onDone((((h % 12) + (pm ? 12 : 0)) * 3600 + m * 60 + s) * 1000);
  };

  return (
    <MmDialog
      title={title}
      onDismiss={() => onDone(undefined)}
      actions={
        <>
          <MmButton label="Cancel" kind="text" onPress={() => onDone(undefined)} />
          <MmButton label="OK" onPress={confirm} />
        </>
      }
    >
      <div className="mm-clock-fields">
        <MmTextField label="Hour" kind="number" dense value={hour} onChange={setHour} />
        <MmTextField label="Min" kind="number" dense value={minute} onChange={setMinute} />
        <MmTextField label="Sec" kind="number" dense value={second} onChange={setSecond} />
      </div>
      <MmSegmented
        name="AM or PM"
        segments={[
          { value: false, label: 'AM' },
          { value: true, label: 'PM' },
        ]}
        selected={pm}
        onChange={(chosen) => setPm(chosen ?? pm)}
      />
      {error === undefined ? null : (
        <p className="mm-dialog-error" role="alert">
          {error}
        </p>
      )}
    </MmDialog>
  );
}
