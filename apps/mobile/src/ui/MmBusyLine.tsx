import { MmSpinner } from './MmSpinner';
import './ui.css';

/**
 * A wait, in the line where the words will stand (MM-673): the dense
 * spinner and the words that say what is waited for ("The coach is
 * writing…"). Anything that waits on the network shows this from the start,
 * never a provisional answer replaced on arrival (the owner, 2026-10-28).
 */
export function MmBusyLine({ label }: { label: string }) {
  return (
    <div className="mm-busy-line" role="status" aria-live="polite">
      <MmSpinner dense />
      <span>{label}</span>
    </div>
  );
}
