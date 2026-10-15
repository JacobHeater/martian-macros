import './ui.css';

/** The most marks on a row, so a row fits a 360 px phone beside a section's icon. */
const mostOnARow = 12;

interface MmTallyProps {
  /** How many marks there are. */
  of: number;
  /** How many are filled, in halves: 2.5 is two full and one half. */
  value: number;
}

/**
 * A count to fill (MM-326): one mark per unit of a goal, full, half or
 * empty, packed from the start on rows of equal length (16 is two rows of
 * 8, never 14 and 2) so it reads as a count, not as days. The marks are the
 * rhythm strip's dots (MM-253, rule 3). Like a progress bar it is
 * decoration: whatever shows it says the count in words beside it.
 */
export function MmTally({ of, value }: MmTallyProps) {
  const mark = (i: number) => {
    if (value >= i + 1) return 'full';
    return value > i ? 'half' : 'none';
  };
  const rows = Math.ceil(of / mostOnARow);
  return (
    <span className="mm-tally" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${Math.ceil(of / rows)}, auto)` }}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`mm-rhythm-dot mm-rhythm-${mark(i)}`} data-mark={mark(i)} />
      ))}
    </span>
  );
}
