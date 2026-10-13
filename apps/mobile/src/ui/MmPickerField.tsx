import { useRef } from 'react';
import { MmIcon } from './MmIcon';
import './ui.css';

interface MmPickerFieldProps {
  /** The phone's own control behind the field. */
  kind: 'date' | 'time';
  label: string;
  value: string;
  min?: string | undefined;
  max?: string | undefined;
  onChange: (value: string) => void;
}

/**
 * A date or time field in the design system's box, over the phone's own
 * picker. The platform draws nothing of its own: its indicator is hidden
 * and the box carries the chevron at the field's inset, so the control
 * looks the same on Android, in a browser and in the register (MM-260).
 * Pressing anywhere in the field opens the picker.
 */
export function MmPickerField({ kind, label, value, min, max, onChange }: MmPickerFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const open = () => {
    const element = input.current;
    if (element === null) return;
    try {
      // A browser without showPicker opens its own on focus; Android does too.
      element.showPicker?.();
    } catch {
      element.focus();
    }
  };
  return (
    <div className="mm-field-box mm-picker-box">
      <input
        ref={input}
        type={kind}
        className="mm-field-input mm-picker-input"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={open}
      />
      <span className="mm-picker-chevron" aria-hidden="true">
        <MmIcon name="chevronDown" size={20} />
      </span>
    </div>
  );
}
