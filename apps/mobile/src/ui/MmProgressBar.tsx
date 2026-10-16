import { clamp } from '../lang/clamp';
import type { MmProgressKind } from './MmProgressKind';
import type { MmProgressWeight } from './MmProgressWeight';
import { usePoured } from './usePoured';
import './ui.css';

interface MmProgressBarProps {
  /** 0 to 1. */
  value: number;
  /** What is measured: the energy colour unless a macro is named. */
  kind?: MmProgressKind;
  weight?: MmProgressWeight;
  /** Places along the bar, 0 to 1, marked with a line (a minimum, a target). */
  markers?: readonly number[];
}

/**
 * A horizontal progress bar for an amount against a target (0 to 1), with
 * full-round ends. It is decoration: whatever shows it says the figures in
 * words beside it. It takes meaning and weight, never a colour or a size
 * (MM-278). Water pours (MM-326): it fills from empty each time it appears,
 * and at every change of its level its surface ripples and flattens; with
 * reduced motion it takes its level at once.
 */
export function MmProgressBar({ value, kind = 'energy', weight = 'regular', markers = [] }: MmProgressBarProps) {
  const pours = kind === 'water';
  const poured = usePoured(pours);
  const level = clamp(value, 0, 1);
  return (
    <span className={`mm-progress mm-progress-${kind} mm-progress-${weight}`} aria-hidden="true">
      <span className="mm-progress-fill" style={{ width: `${poured ? level * 100 : 0}%` }}>
        {/* Keyed on the level, so each change ripples anew. */}
        {pours && poured && level > 0 ? <span key={level} className="mm-progress-wave" /> : null}
      </span>
      {markers.map((marker) => (
        <span
          key={marker}
          className="mm-progress-marker"
          data-at={marker}
          style={{
            left: `min(${clamp(marker, 0, 1) * 100}%, calc(100% - 2px))`,
          }}
        />
      ))}
    </span>
  );
}
