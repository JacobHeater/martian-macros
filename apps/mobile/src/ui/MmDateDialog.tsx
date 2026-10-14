import { useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { MmButton } from './MmButton';
import { MmDatePicker } from './MmDatePicker';
import { MmDialog } from './MmDialog';
import './ui.css';

interface MmDateDialogProps {
  helpText: string;
  initial: CalendarDate;
  first: CalendarDate;
  last: CalendarDate;
  today?: CalendarDate | undefined;
  /** Called with the day chosen, or undefined when backed out of. */
  onDone: (date: CalendarDate | undefined) => void;
}

/**
 * Asks for a calendar day with the design system's own calendar (MM-263),
 * and says the day back in words under it, or the allowed range when a day
 * outside it is tried (MM-260). No native control is anywhere in it.
 */
export function MmDateDialog({ helpText, initial, first, last, today, onDone }: MmDateDialogProps) {
  const [chosen, setChosen] = useState(initial);
  const [refused, setRefused] = useState(false);
  const allowed = !chosen.isBefore(first) && !chosen.isAfter(last);
  const range = `Choose a day between ${Fmt.longDate(first)} and ${Fmt.longDate(last)}.`;
  return (
    <MmDialog
      title={helpText}
      onDismiss={() => onDone(undefined)}
      actions={
        <>
          <MmButton label="Cancel" kind="text" onPress={() => onDone(undefined)} />
          <MmButton label="OK" onPress={allowed ? () => onDone(chosen) : undefined} />
        </>
      }
    >
      <MmDatePicker
        name={helpText}
        value={chosen}
        first={first}
        last={last}
        today={today}
        onChange={(day) => {
          setChosen(day);
          setRefused(false);
        }}
        onRefuse={() => setRefused(true)}
      />
      {allowed && !refused ? (
        <p className="mm-date-detail">{Fmt.longDate(chosen)}</p>
      ) : (
        <p className="mm-dialog-error" role="alert">
          {range}
        </p>
      )}
    </MmDialog>
  );
}
