import type { CSSProperties } from 'react';
import { clamp } from '../lang/clamp';
import './ui.css';

interface MmSliderProps {
  /** What a person hears. */
  name: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** How many equal steps the range is cut into; any value when left out. */
  divisions?: number | undefined;
  /** The value in words ("0.5% a week"), so every slider speaks its value. */
  label: string;
}

/**
 * The app's slider. The track, its filled part and the thumb are drawn by
 * the design system (MM-266); the native control underneath keeps the
 * keyboard, the drag and the screen reader.
 */
export function MmSlider({ name, value, onChange, min = 0, max = 1, divisions, label }: MmSliderProps) {
  const fill = max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
  const style = { '--mm-slider-fill': `${fill * 100}%` } as CSSProperties;
  return (
    <input
      type="range"
      className="mm-slider"
      style={style}
      aria-label={name}
      aria-valuetext={label}
      min={min}
      max={max}
      step={divisions === undefined ? 'any' : (max - min) / divisions}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
