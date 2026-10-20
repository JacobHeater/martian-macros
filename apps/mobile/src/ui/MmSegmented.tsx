import { MmIcon } from './MmIcon';
import type { MmSegment } from './MmSegment';
import './ui.css';

interface MmSegmentedProps<T> {
  /** What a person hears for the group of choices. */
  name: string;
  segments: readonly MmSegment<T>[];
  /** The chosen value; undefined when nothing is chosen. */
  selected: T | undefined;
  onChange: (value: T | undefined) => void;
  /** Smaller, without the check mark; for use beside a heading. */
  compact?: boolean;
  /** Whether choosing the chosen one again clears it (an optional mark). */
  allowEmpty?: boolean;
}

/** A short single-choice control (units, a chart range). */
export function MmSegmented<T>({ name, segments, selected, onChange, compact = false, allowEmpty = false }: MmSegmentedProps<T>) {
  return (
    <div className={`mm-segmented${compact ? ' mm-segmented-compact' : ''}`} role="group" aria-label={name}>
      {segments.map((segment) => {
        const chosen = segment.value === selected;
        return (
          <button
            key={String(segment.value)}
            type="button"
            className={`mm-segment${chosen ? ' mm-segment-selected' : ''}`}
            aria-pressed={chosen}
            onClick={() => {
              if (!chosen) onChange(segment.value);
              else if (allowEmpty) onChange(undefined);
            }}
          >
            {chosen ? <MmIcon name="check" size={16} /> : null}
            {!chosen && segment.icon !== undefined ? <MmIcon name={segment.icon} size={16} /> : null}
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
