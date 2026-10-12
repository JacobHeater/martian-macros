import './ui.css';

interface MmChoiceChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/** A chip that is one of several choices. */
export function MmChoiceChip({ label, selected, onSelect }: MmChoiceChipProps) {
  return (
    <button
      type="button"
      className={`mm-chip mm-chip-choice${selected ? ' mm-chip-selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
