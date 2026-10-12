import { useState } from 'react';
import { MmButton } from './MmButton';
import { MmDialog } from './MmDialog';
import './ui.css';

interface MmTimeOfDayDialogProps {
  initialMinuteOfDay: number;
  helpText?: string | undefined;
  /** Called with minutes after midnight, or undefined when backed out of. */
  onDone: (minuteOfDay: number | undefined) => void;
}

const two = (n: number) => String(n).padStart(2, '0');

/** Asks for a time of day with the phone's own time control. */
export function MmTimeOfDayDialog({ initialMinuteOfDay, helpText, onDone }: MmTimeOfDayDialogProps) {
  const [value, setValue] = useState(`${two(Math.trunc(initialMinuteOfDay / 60))}:${two(initialMinuteOfDay % 60)}`);
  const title = helpText ?? 'Select time';
  const confirm = () => {
    const [hours, minutes] = value.split(':').map(Number);
    if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) return;
    onDone(hours * 60 + minutes);
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
      <input
        type="time"
        className="mm-field-input mm-time-input"
        aria-label={title}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </MmDialog>
  );
}
