import { useId } from 'react';
import type { MmMenuItem } from './MmMenuItem';
import './ui.css';

interface MmDropdownProps<T> {
  label: string;
  value: T;
  items: readonly MmMenuItem<T>[];
  /** With no action the field is shown as off. */
  onChange: ((value: T) => void) | undefined;
}

/** A labeled, full-width dropdown field. */
export function MmDropdown<T>({ label, value, items, onChange }: MmDropdownProps<T>) {
  const id = useId();
  const index = items.findIndex((item) => item.value === value);
  return (
    <div className="mm-field">
      <label className="mm-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="mm-field-box">
        <select
          id={id}
          className="mm-field-input mm-select"
          value={index}
          disabled={onChange === undefined}
          onChange={(event) => {
            const item = items[Number(event.target.value)];
            if (item !== undefined) onChange?.(item.value);
          }}
        >
          {items.map((item, i) => (
            <option key={item.label} value={i}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
