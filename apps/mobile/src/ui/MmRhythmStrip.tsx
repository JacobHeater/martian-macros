import type { MmRhythmDay } from './MmRhythmDay';
import './ui.css';

interface MmRhythmStripProps {
  /** What a person hears for the strip as a whole ("Last seven days"). */
  name: string;
  days: readonly MmRhythmDay[];
  /** With it, each day is pressed to open it; without, the strip only shows. */
  onSelect?: ((key: string) => void) | undefined;
}

/**
 * The rhythm of a week (MM-253, rule 3): one dot a day, full when the day
 * was done, half when part of it was, empty otherwise, with today ringed.
 * A graphic that carries information and no colour of its own: the marks
 * are shape and fill, and every dot says its day and its state aloud.
 */
export function MmRhythmStrip({ name, days, onSelect }: MmRhythmStripProps) {
  const body = (day: MmRhythmDay) => (
    <>
      <span className={`mm-rhythm-dot mm-rhythm-${day.mark}${day.today === true ? ' mm-rhythm-today' : ''}`} aria-hidden="true" />
      <span className="mm-rhythm-letter" aria-hidden="true">
        {day.letter}
      </span>
    </>
  );
  return (
    <div className="mm-rhythm" role="group" aria-label={name}>
      {days.map((day) =>
        onSelect === undefined ? (
          <span key={day.key} className="mm-rhythm-day" role="img" aria-label={day.label}>
            {body(day)}
          </span>
        ) : (
          <button
            key={day.key}
            type="button"
            className="mm-rhythm-day mm-rhythm-day-button"
            aria-label={day.label}
            aria-current={day.today === true ? 'date' : undefined}
            onClick={() => onSelect(day.key)}
          >
            {body(day)}
          </button>
        ),
      )}
    </div>
  );
}
