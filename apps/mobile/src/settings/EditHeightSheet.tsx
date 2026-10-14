import { useState } from 'react';
import { Units } from '../domain/Units';
import { parseNumber } from '../format/parseNumber';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmButton } from '../ui/MmButton';
import { MmTextField } from '../ui/MmTextField';
import './settings.css';

interface EditHeightSheetProps {
  initialCm: number;
  imperial: boolean;
  /** Called with a plausible height in centimetres; the sheet then closes. */
  onSave: (heightCm: number) => void;
  /** Called when the person leaves without saving. */
  onCancel?: (() => void) | undefined;
}

const lowestCm = 100;
const highestCm = 250;

/**
 * A sheet to correct the user's height. Saves only a plausible value, and
 * says the allowed range under the field, so an inert Save explains itself
 * (MM-271).
 */
export function EditHeightSheet({ initialCm, imperial, onSave, onCancel }: EditHeightSheetProps) {
  const totalInches = roundHalfAwayFromZero(Units.cmToInches(initialCm));
  const [feet, setFeet] = useState(imperial ? `${Math.trunc(totalInches / 12)}` : '');
  const [inches, setInches] = useState(imperial ? `${totalInches % 12}` : '');
  const [cm, setCm] = useState(imperial ? '' : `${roundHalfAwayFromZero(initialCm) + 0}`);

  /** The entered height in centimetres, or undefined when nothing usable is typed. */
  const entered = ((): number | undefined => {
    if (!imperial) return parseNumber(cm);
    const whole = parseNumber(feet);
    return whole === undefined ? undefined : Units.inchesToCm(whole * 12 + (parseNumber(inches) ?? 0));
  })();
  const plausible = entered !== undefined && entered >= lowestCm && entered <= highestCm;
  const heightCm = plausible ? entered : undefined;
  const range = imperial ? 'Between 3 ft 3 in and 8 ft 2 in.' : `Between ${lowestCm} and ${highestCm} cm.`;
  const typed = imperial ? feet.trim() !== '' : cm.trim() !== '';
  const error = typed && !plausible ? range : undefined;
  const helper = error === undefined ? range : undefined;

  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Height</h2>
      {imperial ? (
        <div className="settings-fields">
          <MmTextField label="Feet" kind="number" value={feet} onChange={setFeet} error={error} />
          <MmTextField label="Inches" kind="number" value={inches} onChange={setInches} helper={helper} />
        </div>
      ) : (
        <MmTextField label="Centimetres" kind="number" value={cm} onChange={setCm} error={error} helper={helper} />
      )}
      <div className="app-gap" />
      <div className="app-row app-row-end">
        {onCancel === undefined ? null : <MmButton label="Cancel" kind="text" onPress={onCancel} />}
        <MmButton label="Save" onPress={heightCm === undefined ? undefined : () => onSave(heightCm)} />
      </div>
    </div>
  );
}
