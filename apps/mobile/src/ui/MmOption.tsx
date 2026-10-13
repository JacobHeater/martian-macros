import { MmIcon } from './MmIcon';
import './ui.css';

interface MmOptionProps {
  label: string;
  chosen: boolean;
  onSelect: () => void;
}

/**
 * One row of a list of options to choose from, inside a `role="listbox"`:
 * the label, and a check with "Chosen" said aloud when it is the current
 * one. The one way a dialog offers a choice from a list (MM-261).
 */
export function MmOption({ label, chosen, onSelect }: MmOptionProps) {
  return (
    <button type="button" role="option" aria-selected={chosen} className="mm-option" onClick={onSelect}>
      <span>{label}</span>
      {chosen ? (
        <span className="mm-option-check">
          <MmIcon name="check" />
          <span className="mm-visually-hidden">Chosen</span>
        </span>
      ) : null}
    </button>
  );
}
