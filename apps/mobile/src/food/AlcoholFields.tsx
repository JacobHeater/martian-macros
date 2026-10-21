import { useState } from 'react';
import { StandardDrink } from '../domain/food/alcohol/StandardDrink';
import { parseNumber } from '../format/parseNumber';
import { MmTextField } from '../ui/MmTextField';
import { editableNumber } from './editableNumber';

interface AlcoholFieldsProps {
  /** The grams as typed; what the entry stores. */
  grams: string;
  onGrams: (grams: string) => void;
}

/**
 * A typed entry's alcohol (MM-127): in grams, or as a count of standard
 * drinks that fills the grams in at 14 g each. Only the grams are kept; a
 * count typed is cleared when the grams are typed over.
 */
export function AlcoholFields({ grams, onGrams }: AlcoholFieldsProps) {
  const [drinks, setDrinks] = useState('');
  return (
    <>
      <div className="food-fields">
        <MmTextField
          label="Alcohol g"
          kind="number"
          dense
          value={grams}
          onChange={(typed) => {
            setDrinks('');
            onGrams(typed);
          }}
        />
        <MmTextField
          label="Standard drinks"
          kind="number"
          dense
          value={drinks}
          onChange={(typed) => {
            setDrinks(typed);
            const count = parseNumber(typed);
            onGrams(count === undefined || count < 0 ? '' : editableNumber(StandardDrink.toGrams(count)));
          }}
        />
      </div>
      <p className="app-caption food-reference-line">One standard drink is 14 g. Counted at 7 kcal per gram.</p>
    </>
  );
}
