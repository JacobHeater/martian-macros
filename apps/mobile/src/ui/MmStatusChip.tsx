import './ui.css';

/** A word or two of status beside something: it does nothing when touched. */
export function MmStatusChip({ label }: { label: string }) {
  return <span className="mm-chip mm-chip-status">{label}</span>;
}
