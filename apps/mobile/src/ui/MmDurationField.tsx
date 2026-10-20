import { MmTextField } from './MmTextField';
import './ui.css';

interface MmDurationFieldProps {
  /** What the duration is ("Last night"): heard with each field, so hours and minutes are told apart from another's. */
  name: string;
  hours: string;
  minutes: string;
  onChange: (hours: string, minutes: string) => void;
  /** What is wrong with the value and which field it concerns: said beside that field, and aloud, with the field marked (MM-279, MM-414). */
  error?: { on: 'hours' | 'minutes'; text: string } | undefined;
  /** The keyboard's action key does this, when the value can be acted on (MM-296). */
  onSubmit?: (() => void) | undefined;
}

/**
 * A length of time typed as hours and minutes (MM-250): two dense number
 * fields side by side, "h" and "m" said once each. Never a decimal hour,
 * which a person has to work out; never a native time picker (MM-262).
 * Each field is heard as the name and its part: "Last night, Hours".
 */
export function MmDurationField({ name, hours, minutes, onChange, error, onSubmit }: MmDurationFieldProps) {
  return (
    <div className="mm-duration-field" role="group" aria-label={name}>
      <MmTextField
        label="Hours"
        name={`${name}, Hours`}
        kind="number"
        suffix="h"
        dense
        value={hours}
        error={error?.on === 'hours' ? error.text : undefined}
        onSubmit={onSubmit}
        onChange={(typed) => onChange(typed, minutes)}
      />
      <MmTextField
        label="Minutes"
        name={`${name}, Minutes`}
        kind="number"
        suffix="m"
        dense
        value={minutes}
        error={error?.on === 'minutes' ? error.text : undefined}
        onSubmit={onSubmit}
        onChange={(typed) => onChange(hours, typed)}
      />
    </div>
  );
}
