import { MmProgressBar } from './MmProgressBar';
import './ui.css';

interface MmNutrientRowProps {
  /** "Iron". */
  name: string;
  /** The amount in words, at the end of the row ("9 mg", "Not stated by any food"). */
  figures: string;
  /** A second line: where the amount came from or what it is against ("from 4 of 7 foods"). */
  note?: string | undefined;
  /** The day's known amount, for the bar. */
  amount?: number | undefined;
  /** What the bar is drawn against; without one the row has no bar. */
  reference?: number | undefined;
}

const units: readonly (readonly [RegExp, string])[] = [
  [/(\d) µg\b/g, '$1 micrograms'],
  [/(\d) mg\b/g, '$1 milligrams'],
  [/(\d) g\b/g, '$1 grams'],
];

/** The row as one sentence, with its units spelled out, so it is heard together (MM-310). */
const spoken = (text: string) => units.reduce((said, [unit, word]) => said.replace(unit, word), text);

/**
 * One nutrient of a day (MM-310): its name and amount in words, and, when it
 * has a reference, a quiet bar to a marker at that reference. The bar runs a
 * quarter past the marker so an amount over it shows, and it is drawn in one
 * neutral whatever the amount: it states, it does not judge (MM-108). A
 * screen reader hears the row as one sentence.
 */
export function MmNutrientRow({ name, figures, note, amount, reference }: MmNutrientRowProps) {
  const span = reference === undefined || reference <= 0 ? undefined : reference * 1.25;
  return (
    <div className="mm-nutrient-row">
      <span className="mm-visually-hidden">{spoken([name, figures, ...(note === undefined ? [] : [note])].join(', '))}</span>
      <div className="mm-nutrient-row-head" aria-hidden="true">
        <span className="mm-nutrient-row-name">{name}</span>
        <span className="mm-nutrient-row-figures">{figures}</span>
      </div>
      {span === undefined ? null : (
        <MmProgressBar kind="nutrient" weight="thin" value={(amount ?? 0) / span} markers={[0.8]} />
      )}
      {note === undefined ? null : (
        <span className="mm-nutrient-row-note" aria-hidden="true">
          {note}
        </span>
      )}
    </div>
  );
}
