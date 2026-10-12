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
  /** The value in words ("0.5% a week"), for assistive technology. */
  label?: string | undefined;
}

/** The app's slider. */
export function MmSlider({ name, value, onChange, min = 0, max = 1, divisions, label }: MmSliderProps) {
  return (
    <input
      type="range"
      className="mm-slider"
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
