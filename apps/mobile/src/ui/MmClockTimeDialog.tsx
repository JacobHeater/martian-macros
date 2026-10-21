import { useState } from 'react';
import { MmButton } from './MmButton';
import { MmDialog } from './MmDialog';
import { MmTimePicker } from './MmTimePicker';
import './ui.css';

interface MmClockTimeDialogProps {
  title: string;
  /** The time it opens on, in milliseconds after midnight. */
  initialMs: number;
  /** Why a time cannot be taken, if it cannot: said in place of the time, and OK is off (MM-222). */
  refuse?: ((timeMs: number) => string | undefined) | undefined;
  /** Called with the time in milliseconds after midnight, or undefined when backed out of. */
  onDone: (timeMs: number | undefined) => void;
}

const secondsPerDay = 24 * 3600;
const two = (n: number) => String(n).padStart(2, '0');

/** A time of day to the second, in words: "12:02:10 PM". */
const said = (secondOfDay: number) => {
  const hour = Math.floor(secondOfDay / 3600) % 24;
  const minute = Math.floor(secondOfDay / 60) % 60;
  return `${hour % 12 === 0 ? 12 : hour % 12}:${two(minute)}:${two(secondOfDay % 60)} ${hour < 12 ? 'AM' : 'PM'}`;
};

/**
 * Asks for a time of day to the second with the design system's drums
 * (MM-264): Hour, Minute and Second, and AM or PM. Nothing typed can be
 * refused for not existing, because the drums only offer times that do;
 * one the asker refuses is refused here, with its reason, so what was
 * chosen stays on the drums (MM-222).
 */
export function MmClockTimeDialog({ title, initialMs, refuse, onDone }: MmClockTimeDialogProps) {
  const [seconds, setSeconds] = useState(Math.trunc(initialMs / 1000) % secondsPerDay);
  const refusal = refuse?.(seconds * 1000);
  return (
    <MmDialog
      title={title}
      onDismiss={() => onDone(undefined)}
      actions={
        <>
          <MmButton label="Cancel" kind="text" onPress={() => onDone(undefined)} />
          <MmButton label="OK" onPress={refusal === undefined ? () => onDone(seconds * 1000) : undefined} />
        </>
      }
    >
      <MmTimePicker value={seconds} everyMinute seconds onChange={setSeconds} />
      <p className="mm-time-detail">{said(seconds)}</p>
      {refusal === undefined ? null : (
        <p className="mm-dialog-error" role="alert">
          {refusal}
        </p>
      )}
    </MmDialog>
  );
}
