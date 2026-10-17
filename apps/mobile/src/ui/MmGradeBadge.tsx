import { useRef } from 'react';
import type { MmAnchor } from './MmAnchor';
import './ui.css';

interface MmGradeBadgeProps {
  /** The letter shown ("B+"), or undefined for a question mark: there is no grade. */
  letter: string | undefined;
  /** What a person hears: what is graded and its grade ("Lunch: grade C"), or the question the mark asks. */
  label: string;
  /** Opens what the grade means, or why there is none, at the badge's edges. Without it the badge is only read. */
  onExplain?: ((anchor: MmAnchor) => void) | undefined;
  /** Whether the explanation is showing. */
  expanded?: boolean;
}

/**
 * A short grade in a badge filled by its letter's band (MM-370), in a 48 dp
 * slot of its own. The letter carries the meaning, and the fill only
 * repeats it; nothing is red (MM-108). Without a
 * letter it is a dashed question mark. With `onExplain` the badge is a
 * button whose whole slot is the target, so a letter and a question mark
 * look and behave alike: each says what it means when pressed.
 */
export function MmGradeBadge({ letter, label, onExplain, expanded = false }: MmGradeBadgeProps) {
  const anchor = useRef<HTMLButtonElement>(null);
  // Filled by its band, A to D (the first letter); a question mark stays a dashed outline.
  const band = letter?.charAt(0).toLowerCase();
  const kind = letter === undefined ? 'mm-grade mm-grade-unknown' : `mm-grade mm-grade-${band}`;
  if (onExplain === undefined) {
    return (
      <span className="mm-grade-slot">
        <span className={kind} role="img" aria-label={label}>
          {letter ?? '?'}
        </span>
      </span>
    );
  }
  return (
    <span className="mm-grade-slot">
      <button
        ref={anchor}
        type="button"
        className={`${kind} mm-grade-button`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={() => onExplain(anchor.current?.getBoundingClientRect() ?? { top: 0, right: 0, bottom: 0, left: 0 })}
      >
        {letter ?? '?'}
      </button>
    </span>
  );
}
