import './ui.css';

/** A chip that performs a one-tap action (refill from a recent food). */
export function MmActionChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button type="button" className="mm-chip" onClick={onPress}>
      {label}
    </button>
  );
}
