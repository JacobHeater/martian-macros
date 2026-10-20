import { MmTextField } from './MmTextField';
import './ui.css';

interface MmDurationFieldProps {
  /** What the duration is ("Last night"): heard with each field, so hours and minutes are told apart from another's. */
  name: string;
  hours: string;
  minutes: string;
  onChange: (hours: string, minutes: string) => void;
  /** What is wrong with the value, said beside the fields and aloud (MM-279). */
  error?: string | undefined;
  /** The keyboard's action key does this, when the value can be acted on (MM-296). */
  onSubmit?: (() => void) | undefined;
}

/**
 * A length of time typed as hours and minutes (MM-250): two dense number
 * fields side by side, "h" and "m" said once each. Never a decimal hour,
 * which a person has to work out; never a native time picker (MM-262).
 */
export function MmDurationField({ name, hours, minutes, onChange, error, onSubmit }: MmDurationFieldProps) {
  return (
    <div className="mm-duration-field" role="group" aria-label={name}>
      <MmTextField
        label="Hours"
        name={`${name}, hours`}
        kind="number"
        suffix="h"
        dense
        value={hours}
        error={error}
        onSubmit={onSubmit}
        onChange={(typed) => onChange(typed, minutes)}
      />
      <MmTextField
        label="Minutes"
        name={`${name}, minutes`}
        kind="number"
        suffix="m"
        dense
        value={minutes}
        onSubmit={onSubmit}
        onChange={(typed) => onChange(hours, typed)}
      />
    </div>
  );
}
