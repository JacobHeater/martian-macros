import { useId } from 'react';
import type { MmTextFieldKind } from './MmTextFieldKind';
import './ui.css';

interface MmTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Shown above the field, and what a person hears. */
  label?: string | undefined;
  /** What a person hears, when there is no visible label or the label alone is too short to say what the field is. */
  name?: string | undefined;
  hint?: string | undefined;
  helper?: string | undefined;
  /** Styles the helper as a caution (for a value that looks wrong). */
  helperIsWarning?: boolean;
  /** A unit shown after the value. */
  suffix?: string | undefined;
  kind?: MmTextFieldKind;
  dense?: boolean;
}

/** The app's text input. */
export function MmTextField({
  value,
  onChange,
  label,
  name,
  hint,
  helper,
  helperIsWarning = false,
  suffix,
  kind = 'text',
  dense = false,
}: MmTextFieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  return (
    <div className={`mm-field${dense ? ' mm-field-dense' : ''}`}>
      {label === undefined ? null : (
        <label className="mm-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="mm-field-box">
        <input
          id={id}
          className="mm-field-input"
          type="text"
          inputMode={kind === 'number' ? 'decimal' : 'text'}
          autoCapitalize={kind === 'text' ? 'sentences' : 'none'}
          autoComplete="off"
          aria-label={name}
          aria-describedby={helper === undefined ? undefined : helperId}
          placeholder={hint}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix === undefined ? null : <span className="mm-field-suffix">{suffix}</span>}
      </div>
      {helper === undefined ? null : (
        <p id={helperId} className={`mm-field-helper${helperIsWarning ? ' mm-field-helper-warning' : ''}`}>
          {helper}
        </p>
      )}
    </div>
  );
}
