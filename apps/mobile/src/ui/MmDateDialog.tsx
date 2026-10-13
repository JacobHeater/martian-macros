import { useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { MmButton } from './MmButton';
import { MmDialog } from './MmDialog';
import './ui.css';

interface MmDateDialogProps {
  helpText: string;
  initial: CalendarDate;
  first: CalendarDate;
  last: CalendarDate;
  /** Called with the day chosen, or undefined when backed out of. */
  onDone: (date: CalendarDate | undefined) => void;
}

function parsed(iso: string): CalendarDate | undefined {
  try {
    return CalendarDate.parse(iso);
  } catch {
    return undefined;
  }
}

/**
 * Asks for a calendar day with the phone's own date control, and says the
 * day back in words under it, or why it cannot be taken (MM-260).
 */
export function MmDateDialog({ helpText, initial, first, last, onDone }: MmDateDialogProps) {
  const [value, setValue] = useState(initial.toString());
  const date = parsed(value);
  const allowed = date !== undefined && !date.isBefore(first) && !date.isAfter(last);
  return (
    <MmDialog
      title={helpText}
      onDismiss={() => onDone(undefined)}
      actions={
        <>
          <MmButton label="Cancel" kind="text" onPress={() => onDone(undefined)} />
          <MmButton label="OK" onPress={allowed ? () => onDone(date) : undefined} />
        </>
      }
    >
      <input
        type="date"
        className="mm-field-input mm-time-input"
        aria-label={helpText}
        min={first.toString()}
        max={last.toString()}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {allowed ? (
        <p className="mm-date-detail">{Fmt.longDate(date)}</p>
      ) : (
        <p className="mm-dialog-error" role="alert">
          {date === undefined
            ? 'Enter a full date.'
            : `Choose a day between ${Fmt.longDate(first)} and ${Fmt.longDate(last)}.`}
        </p>
      )}
    </MmDialog>
  );
}
