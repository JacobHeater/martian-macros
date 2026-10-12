import type { CSSProperties } from 'react';
import { clamp } from '../lang/clamp';
import './ui.css';

interface MmProgressBarProps {
  /** 0 to 1. */
  value: number;
  /** A CSS color; the energy color unless given. */
  color?: string | undefined;
  /** Places along the bar, 0 to 1, marked with a line (a minimum, a target). */
  markers?: readonly number[];
  height?: number;
}

/**
 * A horizontal progress bar for an amount against a target (0 to 1), with
 * full-round ends. It is decoration: whatever shows it says the figures in
 * words beside it.
 */
export function MmProgressBar({ value, color, markers = [], height = 8 }: MmProgressBarProps) {
  const style = { height, '--mm-bar-color': color } as CSSProperties;
  return (
    <span className="mm-progress" style={style} aria-hidden="true">
      <span className="mm-progress-fill" style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
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
