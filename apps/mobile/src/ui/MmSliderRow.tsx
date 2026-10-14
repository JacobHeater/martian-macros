import { MmSlider } from './MmSlider';
import './ui.css';

interface MmSliderRowProps {
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
 * A slider as a row of a list group, at the inset every other row has. It
 * belongs to the row over it (the switch that turns it on, say), so no
 * divider is drawn between them (MM-240).
 */
export function MmSliderRow(props: MmSliderRowProps) {
  return (
    <div className="mm-list-row mm-slider-row">
      <MmSlider {...props} />
    </div>
  );
}
