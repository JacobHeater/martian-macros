import { useId } from 'react';
import { MmIcon } from './MmIcon';
import './ui.css';

interface MmPickerFieldProps {
  /** Shown above the field. */
  label: string;
  /** The value, in words ("January 1, 1996", "Lunch"). */
  valueText: string;
  /** What pressing opens; with no action the field is shown as off, its value still readable. */
  onPress: (() => void) | undefined;
  /** What opens: a picker in a dialog, or the options list. */
  opens?: 'dialog' | 'listbox';
  /** Whether what it opens is showing. */
  expanded?: boolean | undefined;
  helper?: string | undefined;
  /** What is wrong with the value, said beside the field and aloud (MM-279). */
  error?: string | undefined;
}

/**
 * A field that opens a chooser: a visible label, the value in words and our
 * chevron, pressable anywhere (MM-263, MM-265). Nothing native is near it;
 * the date picker, the time picker and the options list it opens are the
 * design system's own.
 */
export function MmPickerField({ label, valueText, onPress, opens = 'dialog', expanded, helper, error }: MmPickerFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const noteId = `${id}-note`;
  const note = error ?? helper;
  return (
    <div className="mm-field">
      <span id={labelId} className="mm-field-label">
        {label}
      </span>
      <button
        type="button"
        className={`mm-field-box mm-picker-box${error === undefined ? '' : ' mm-field-box-error'}`}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup={opens}
        aria-expanded={expanded}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={note === undefined ? undefined : noteId}
        disabled={onPress === undefined}
        onClick={onPress}
      >
        <span id={valueId} className="mm-picker-value">
          {valueText}
        </span>
        <span className="mm-picker-chevron" aria-hidden="true">
          <MmIcon name="chevronDown" size={20} />
        </span>
      </button>
      {note === undefined ? null : (
        <p
          id={noteId}
          className={`mm-field-helper${error === undefined ? '' : ' mm-field-error'}`}
          role={error === undefined ? undefined : 'alert'}
        >
          {note}
        </p>
      )}
    </div>
  );
}
