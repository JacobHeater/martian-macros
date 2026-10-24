import { useId, useLayoutEffect, useRef } from 'react';
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
  /** For a passphrase: whether it is being chosen or recalled, so a password manager offers the right thing (MM-63). */
  secret?: 'new' | 'existing';
  /** For a passphrase: shown as typed, on the person's request (NIST SP 800-63B: offer to display the secret). */
  revealed?: boolean;
  kind?: MmTextFieldKind;
  dense?: boolean;
  /** The id of words outside the field that also describe it (a hint drawn across a row, MM-295). */
  describedBy?: string | undefined;
  /** The keyboard's action key does this ("Done"), when the value can be acted on (MM-296). */
  onSubmit?: (() => void) | undefined;
  /** Takes focus when it appears: for a field that is the next useful thing after a control went away (MM-413). */
  autoFocus?: boolean;
  /** Called when focus leaves the field: for a check said once the value is typed, not on every keystroke (MM-507). */
  onBlur?: (() => void) | undefined;
  /** The helper is said politely as it changes (a caution that follows the value typed, MM-507). */
  helperPolite?: boolean;
  /**
   * For text that may run to sentences (MM-603): the lines the field shows
   * when empty. Above one it is a text area that grows with what is typed,
   * to eight lines, then scrolls; Enter starts a new line. One by default.
   */
  lines?: number;
}

/** The most lines a field grows to before it scrolls (MM-603). */
const maxLines = 8;

/** The app's text input: one line, or several for longer text (MM-603). */
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
  secret = 'new',
  revealed = false,
  kind = 'text',
  dense = false,
  describedBy: describedByOutside,
  onSubmit,
  autoFocus = false,
  onBlur,
  helperPolite = false,
  lines = 1,
}: MmTextFieldProps) {
  const id = useId();
  const multiline = lines > 1;
  const area = useRef<HTMLTextAreaElement>(null);
  // A text area as tall as what is typed, from `lines` to `maxLines`; no handle is drawn to drag it (MM-262).
  useLayoutEffect(() => {
    const element = area.current;
    if (element === null) return;
    element.style.height = 'auto';
    const line = Number.parseFloat(getComputedStyle(element).lineHeight) || 24;
    element.style.height = `${Math.min(Math.max(element.scrollHeight, line * lines), line * maxLines)}px`;
  }, [value, lines]);
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const suffixId = `${id}-suffix`;
  const spoken = name === undefined ? undefined : label === undefined || name.includes(label) ? name : `${label}, ${name}`;
  const describedBy = [
    error === undefined ? undefined : errorId,
    suffix === undefined ? undefined : suffixId,
    helper === undefined ? undefined : helperId,
    describedByOutside,
  ]
    .filter(Boolean)
    .join(' ');
  const helperLine =
    helper === undefined ? null : (
      <p id={helperId} className={`mm-field-helper${helperIsWarning ? ' mm-field-helper-warning' : ''}`}>
        {helper}
      </p>
    );
  return (
    <div className={`mm-field${dense ? ' mm-field-dense' : ''}`}>
      {label === undefined ? null : (
        <label className="mm-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`mm-field-box${multiline ? ' mm-field-box-multiline' : ''}${error === undefined ? '' : ' mm-field-box-error'}`}>
        {multiline ? (
          <textarea
            ref={area}
            id={id}
            className="mm-field-input mm-field-textarea"
            autoFocus={autoFocus}
            rows={lines}
            autoCapitalize="sentences"
            autoComplete="off"
            aria-label={spoken}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={describedBy === '' ? undefined : describedBy}
            placeholder={hint}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
        ) : (
          <input
            id={id}
            className="mm-field-input"
            autoFocus={autoFocus}
            type={kind === 'passphrase' && !revealed ? 'password' : 'text'}
            inputMode={kind === 'number' ? 'decimal' : kind === 'count' ? 'numeric' : 'text'}
            autoCapitalize={kind === 'text' ? 'sentences' : 'none'}
            autoComplete={kind === 'passphrase' ? (secret === 'existing' ? 'current-password' : 'new-password') : 'off'}
            aria-label={spoken}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={describedBy === '' ? undefined : describedBy}
            placeholder={hint}
            enterKeyHint={onSubmit === undefined ? undefined : 'done'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && onSubmit !== undefined) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        )}
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
      {helperPolite ? <div aria-live="polite">{helperLine}</div> : helperLine}
    </div>
  );
}
