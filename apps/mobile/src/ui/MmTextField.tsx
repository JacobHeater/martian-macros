import { useId } from 'react';
import type { MmTextFieldKind } from './MmTextFieldKind';
import './ui.css';

interface MmTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Shown above the field, and what a person hears. */
  label?: string | undefined;
  /**
   * What a person hears, when there is no visible label or the label alone
   * is too short to say what the field is. With a label, the two compose:
   * the visible words stay in what is heard (MM-279).
   */
  name?: string | undefined;
  hint?: string | undefined;
  helper?: string | undefined;
  /** Styles the helper as a caution (for a value that looks wrong). */
  helperIsWarning?: boolean;
  /** What is wrong with the value: said beside the field, and aloud, and the field is marked invalid (MM-279). */
  error?: string | undefined;
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
  error,
  suffix,
  kind = 'text',
  dense = false,
}: MmTextFieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const suffixId = `${id}-suffix`;
  const spoken = name === undefined ? undefined : label === undefined || name.includes(label) ? name : `${label}, ${name}`;
  const describedBy = [
    error === undefined ? undefined : errorId,
    suffix === undefined ? undefined : suffixId,
    helper === undefined ? undefined : helperId,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={`mm-field${dense ? ' mm-field-dense' : ''}`}>
      {label === undefined ? null : (
        <label className="mm-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`mm-field-box${error === undefined ? '' : ' mm-field-box-error'}`}>
        <input
          id={id}
          className="mm-field-input"
          type="text"
          inputMode={kind === 'number' ? 'decimal' : 'text'}
          autoCapitalize={kind === 'text' ? 'sentences' : 'none'}
          autoComplete="off"
          aria-label={spoken}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          placeholder={hint}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix === undefined ? null : (
          <span id={suffixId} className="mm-field-suffix">
            {suffix}
          </span>
        )}
      </div>
      {error === undefined ? null : (
        <p id={errorId} className="mm-field-helper mm-field-error" role="alert">
          {error}
        </p>
      )}
      {helper === undefined ? null : (
        <p id={helperId} className={`mm-field-helper${helperIsWarning ? ' mm-field-helper-warning' : ''}`}>
          {helper}
        </p>
      )}
    </div>
  );
}
