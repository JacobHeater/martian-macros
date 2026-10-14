import { MmDrum } from './MmDrum';
import { MmSegmented } from './MmSegmented';
import './ui.css';

interface MmTimePickerProps {
  /** The time, in seconds after midnight. */
  value: number;
  onChange: (secondOfDay: number) => void;
  /** Every minute rather than every fifth (every fifth is enough for a reminder). */
  everyMinute?: boolean;
  /** A seconds drum as well (the clock of a set). */
  seconds?: boolean;
}

const two = (n: number) => String(n).padStart(2, '0');
const hours = Array.from({ length: 12 }, (_, at) => at + 1);
const sixty = Array.from({ length: 60 }, (_, at) => at);
const fifths = sixty.filter((minute) => minute % 5 === 0);

/**
 * A time of day as drums (MM-264): hour and minute, seconds when asked,
 * and AM or PM as a segmented control, the twelve-hour clock being the one
 * the app's people use. Drawn by the design system; no native time control
 * anywhere.
 */
export function MmTimePicker({ value, onChange, everyMinute = false, seconds = false }: MmTimePickerProps) {
  const hour24 = Math.floor(value / 3600) % 24;
  const minute = Math.floor(value / 60) % 60;
  const second = value % 60;
  const pm = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  // A stored minute off the fifths keeps every minute on offer.
  const minutes = everyMinute || minute % 5 !== 0 ? sixty : fifths;
  const compose = (h12: number, m: number, s: number, isPm: boolean) => ((h12 % 12) + (isPm ? 12 : 0)) * 3600 + m * 60 + s;
  return (
    <div className="mm-time-picker">
      <div className="mm-drums">
        <span className="mm-drums-band" aria-hidden="true" />
        <MmDrum name="Hour" options={hours} value={hour12} onChange={(h) => onChange(compose(h, minute, second, pm))} />
        <span className="mm-drum-colon" aria-hidden="true">
          :
        </span>
        <MmDrum name="Minute" options={minutes} value={minute} text={two} onChange={(m) => onChange(compose(hour12, m, second, pm))} />
        {seconds ? (
          <>
            <span className="mm-drum-colon" aria-hidden="true">
              :
            </span>
            <MmDrum name="Second" options={sixty} value={second} text={two} onChange={(s) => onChange(compose(hour12, minute, s, pm))} />
          </>
        ) : null}
      </div>
      <MmSegmented
        name="AM or PM"
        segments={[
          { value: false, label: 'AM' },
          { value: true, label: 'PM' },
        ]}
        selected={pm}
        onChange={(chosen) => onChange(compose(hour12, minute, second, chosen ?? pm))}
      />
    </div>
  );
}
