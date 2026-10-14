import { MmProgressBar } from './MmProgressBar';
import './ui.css';

interface MmNutrientRowProps {
  /** "Iron". */
  name: string;
  /** The amount in words, at the end of the row ("9 mg", "No data yet"). */
  figures: string;
  /** A second line: where the amount came from or what it is against ("from 4 of 7 foods"). */
  note?: string | undefined;
  /** The day's known amount, for the bar. */
  amount?: number | undefined;
  /** What the bar is drawn against; without one the row has no bar. */
  reference?: number | undefined;
}

/**
 * One nutrient of a day (MM-310): its name and amount in words, and, when it
 * has a reference, a quiet bar to a marker at that reference. The bar runs a
 * quarter past the marker so an amount over it shows, and it is drawn in one
 * colour whatever the amount: it states, it does not judge (MM-108).
 */
export function MmNutrientRow({ name, figures, note, amount, reference }: MmNutrientRowProps) {
  const span = reference === undefined || reference <= 0 ? undefined : reference * 1.25;
  return (
    <div className="mm-nutrient-row">
      <div className="mm-nutrient-row-head">
        <span className="mm-nutrient-row-name">{name}</span>
        <span className="mm-nutrient-row-figures">{figures}</span>
      </div>
      {span === undefined ? null : (
        <MmProgressBar kind="nutrient" weight="thin" value={(amount ?? 0) / span} markers={[0.8]} />
      )}
      {note === undefined ? null : <span className="mm-nutrient-row-note">{note}</span>}
    </div>
  );
}
