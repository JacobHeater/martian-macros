import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface MmStatusChipProps {
  label: string;
  /** A mark before the word, drawn small; the word says what it means. */
  icon?: MmIconName | undefined;
  /**
   * The chip's fill, by meaning (MM-692): `positive` for a state that is done or good, `caution` for one that is
   * incomplete, `neutral` for one not yet decided. Without a tone the chip is the quiet outlined one (MM-611).
   */
  tone?: 'neutral' | 'positive' | 'caution' | undefined;
}

/** A word or two of status beside something: it does nothing when touched. */
export function MmStatusChip({ label, icon, tone }: MmStatusChipProps) {
  const toneClass = tone === undefined ? '' : ` mm-chip-${tone}`;
  return (
    <span className={`mm-chip mm-chip-status${toneClass}`}>
      {icon === undefined ? null : (
        <span className="mm-chip-mark">
          <MmIcon name={icon} size={16} />
        </span>
      )}
      {label}
    </span>
  );
}
