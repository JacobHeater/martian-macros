import { MmIcon } from './MmIcon';
import './ui.css';

interface MmChoiceChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/** A chip that is one of several choices. Chosen, it carries the one icon family's check (MM-276). */
export function MmChoiceChip({ label, selected, onSelect }: MmChoiceChipProps) {
  return (
    <button
      type="button"
      className={`mm-chip mm-chip-choice${selected ? ' mm-chip-selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {selected ? (
        <span className="mm-chip-check" aria-hidden="true">
          <MmIcon name="check" size={16} />
        </span>
      ) : null}
      {label}
    </button>
  );
}
