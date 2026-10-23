import { useId, useState } from 'react';
import { MmIcon } from './MmIcon';
import { MmPressable } from './MmPressable';
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
  /** The foods that add the most, most first, each with its amount in words; with any, pressing the row lists them (MM-561). */
  sources?: readonly { name: string; figures: string }[] | undefined;
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
 * screen reader hears the row as one sentence. With sources, pressing the
 * row opens the foods that add the most underneath (MM-561).
 */
export function MmNutrientRow({ name, figures, note, amount, reference, sources }: MmNutrientRowProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const span = reference === undefined || reference <= 0 ? undefined : reference * 1.25;
  const foldable = sources !== undefined && sources.length > 0;
  const main = (
    <div className="mm-nutrient-row-main">
      <span className="mm-visually-hidden">{spoken([name, figures, ...(note === undefined ? [] : [note])].join(', '))}</span>
      <div className="mm-nutrient-row-head" aria-hidden="true">
        <span className="mm-nutrient-row-name">{name}</span>
        <span className="mm-nutrient-row-figures">{figures}</span>
        {foldable ? (
          <span className={`mm-nutrient-row-chevron${open ? ' mm-nutrient-row-chevron-open' : ''}`}>
            <MmIcon name="chevronDown" size={16} />
          </span>
        ) : null}
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
  return (
    <div className="mm-nutrient-row">
      {foldable ? (
        <MmPressable expanded={open} controls={id} onPress={() => setOpen(!open)}>
          {main}
        </MmPressable>
      ) : (
        main
      )}
      {foldable && open ? (
        <ol id={id} className="mm-nutrient-row-sources" aria-label={`Top foods for ${name}`}>
          {sources.map((source) => (
            <li key={source.name} className="mm-nutrient-row-source">
              <span className="mm-visually-hidden">{spoken(`${source.name}, ${source.figures}`)}</span>
              <span className="mm-nutrient-row-source-name" aria-hidden="true">
                {source.name}
              </span>
              <span className="mm-nutrient-row-source-figures" aria-hidden="true">
                {source.figures}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
