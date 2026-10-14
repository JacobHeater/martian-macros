import { useState } from 'react';
import { MmButton } from './MmButton';
import { MmDialog } from './MmDialog';
import { MmTimePicker } from './MmTimePicker';
import './ui.css';

interface MmTimeOfDayDialogProps {
  initialMinuteOfDay: number;
  helpText?: string | undefined;
  /** The earliest and latest allowed, in minutes after midnight; a time outside is refused with the range said. */
  first?: number | undefined;
  last?: number | undefined;
  everyMinute?: boolean;
  /** Called with minutes after midnight, or undefined when backed out of. */
  onDone: (minuteOfDay: number | undefined) => void;
}

const two = (n: number) => String(n).padStart(2, '0');

/** A time of day in words: "6:30 AM". */
const said = (minuteOfDay: number) => {
  const hour = Math.floor(minuteOfDay / 60) % 24;
  return `${hour % 12 === 0 ? 12 : hour % 12}:${two(minuteOfDay % 60)} ${hour < 12 ? 'AM' : 'PM'}`;
};

/**
 * Asks for a time of day with the design system's drums (MM-264), says the
 * time back in words beneath them, and refuses a time outside the allowed
 * range with the range said, so nothing is refused after the fact.
 */
export function MmTimeOfDayDialog({ initialMinuteOfDay, helpText, first, last, everyMinute = false, onDone }: MmTimeOfDayDialogProps) {
  const [minute, setMinute] = useState(initialMinuteOfDay);
  const title = helpText ?? 'Select time';
  const allowed = (first === undefined || minute >= first) && (last === undefined || minute <= last);
  return (
    <MmDialog
      title={title}
      onDismiss={() => onDone(undefined)}
      actions={
        <>
          <MmButton label="Cancel" kind="text" onPress={() => onDone(undefined)} />
          <MmButton label="OK" onPress={allowed ? () => onDone(minute) : undefined} />
        </>
      }
    >
      <MmTimePicker value={minute * 60} everyMinute={everyMinute} onChange={(seconds) => setMinute(Math.floor(seconds / 60))} />
      {allowed ? (
        <p className="mm-time-detail">{said(minute)}</p>
      ) : (
        <p className="mm-dialog-error" role="alert">
          Choose a time between {said(first ?? 0)} and {said(last ?? 24 * 60 - 1)}.
        </p>
      )}
    </MmDialog>
  );
}
