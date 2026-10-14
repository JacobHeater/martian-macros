import { useState } from 'react';
import type { MmMenuItem } from './MmMenuItem';
import { MmPickerField } from './MmPickerField';
import { useOverlays } from './useOverlays';
import './ui.css';

interface MmDropdownProps<T> {
  label: string;
  value: T;
  items: readonly MmMenuItem<T>[];
  /** With no action the field is shown as off. */
  onChange: ((value: T) => void) | undefined;
  /** What is wrong with the value, said beside the field and aloud. */
  error?: string | undefined;
  /** The words shown while nothing is chosen ("Choose an event"). */
  placeholder?: string | undefined;
}

/**
 * A labeled, full-width field for one of a short list. It renders no
 * native select (MM-265): pressing it opens the design system's options
 * list, with the current value marked "Chosen" (MM-261).
 */
export function MmDropdown<T>({ label, value, items, onChange, error, placeholder }: MmDropdownProps<T>) {
  const overlays = useOverlays();
  const [open, setOpen] = useState(false);
  const current = items.find((item) => item.value === value);
  const choose = async () => {
    setOpen(true);
    const chosen = await overlays.options({ title: label, options: items, selected: value });
    setOpen(false);
    if (chosen !== undefined) onChange?.(chosen.value);
  };
  return (
    <MmPickerField
      label={label}
      valueText={current?.label ?? placeholder ?? ''}
      opens="listbox"
      expanded={open}
      error={error}
      onPress={onChange === undefined ? undefined : () => void choose()}
    />
  );
}
