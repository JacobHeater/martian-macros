import { useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
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

/** Asks for a calendar day with the phone's own date control. */
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
    </MmDialog>
  );
}
