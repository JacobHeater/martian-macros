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
}

/** A sheet to correct the user's height. Saves only a plausible value. */
export function EditHeightSheet({ initialCm, imperial, onSave }: EditHeightSheetProps) {
  const totalInches = roundHalfAwayFromZero(Units.cmToInches(initialCm));
  const [feet, setFeet] = useState(imperial ? `${Math.trunc(totalInches / 12)}` : '');
  const [inches, setInches] = useState(imperial ? `${totalInches % 12}` : '');
  const [cm, setCm] = useState(imperial ? '' : `${roundHalfAwayFromZero(initialCm) + 0}`);

  /** The entered height in centimetres, or undefined if it is not plausible. */
  const heightCm = ((): number | undefined => {
    let entered: number | undefined;
    if (imperial) {
      const whole = parseNumber(feet);
      entered = whole === undefined ? undefined : Units.inchesToCm(whole * 12 + (parseNumber(inches) ?? 0));
    } else {
      entered = parseNumber(cm);
    }
    return entered !== undefined && entered >= 100 && entered <= 250 ? entered : undefined;
  })();

  return (
    <div className="settings-sheet">
      <h2 className="app-headline">Height</h2>
      {imperial ? (
        <div className="settings-fields">
          <MmTextField label="Feet" kind="number" value={feet} onChange={setFeet} />
          <MmTextField label="Inches" kind="number" value={inches} onChange={setInches} />
        </div>
      ) : (
        <MmTextField label="Centimetres" kind="number" value={cm} onChange={setCm} />
      )}
      <div className="app-gap" />
      <MmButton label="Save" onPress={heightCm === undefined ? undefined : () => onSave(heightCm)} />
    </div>
  );
}
