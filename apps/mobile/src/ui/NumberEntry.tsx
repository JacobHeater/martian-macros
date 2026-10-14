import { useId, useState } from 'react';
import { parseNumber } from '../format/parseNumber';
import { FormatError } from '../lang/FormatError';
import { MmButton } from './MmButton';
import type { MmButtonKind } from './MmButtonKind';
import { MmTextField } from './MmTextField';
import './ui.css';

interface NumberEntryProps {
  /** What the number is ("Today’s weigh-in"): the field's name. */
  title: string;
  unit: string;
  initial: string | undefined;
  /** How to take the number: under the field and its Save, and heard with the field (MM-295). */
  hint: string;
  /** What is saved, in a word ("waist"): Save is heard as "Save waist", told apart from another Save (MM-301). */
  saves?: string;
  /** How much Save weighs on the surface: secondary where it is not the screen's main action (MM-301). */
  saveKind?: Extract<MmButtonKind, 'primary' | 'secondary'>;
  /**
   * Saves the value. A refusal (a `FormatError`) is said under the field as
   * "That value looks off"; any other failure as one to try again (MM-303).
   */
  onSave: (value: number) => Promise<void>;
}

/**
 * One number to enter (a weigh-in), with a save button and a hint, on
 * whatever surface holds it. With a value already saved the button waits
 * until the value changes, so no disabled primary sits in a hero (MM-257).
 * What is wrong with a value is said under the field, and the keyboard
 * stays in it (MM-279). The keyboard's action key saves as Save does
 * (MM-296).
 */
export function NumberEntry({ title, unit, initial, hint, saves, saveKind = 'primary', onSave }: NumberEntryProps) {
  const hintId = useId();
  const [text, setText] = useState(initial ?? '');
  const [refused, setRefused] = useState<string>();
  const value = parseNumber(text);
  const changed = text !== (initial ?? '');
  const notANumber = text.trim() !== '' && (value === undefined || value <= 0) ? 'Enter a number above zero.' : undefined;
  const ready = value !== undefined && value > 0 && changed ? value : undefined;

  const save = async (toSave: number) => {
    try {
      await onSave(toSave);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    } catch (error) {
      setRefused(error instanceof FormatError ? 'That value looks off. Check it.' : 'Could not save. Try again.');
    }
  };

  return (
    <div className="mm-number-entry-block">
      <div className="mm-number-entry">
        <MmTextField
          name={title}
          kind="number"
          suffix={unit}
          dense
          value={text}
          describedBy={hintId}
          error={refused ?? notANumber}
          onSubmit={ready === undefined ? undefined : () => void save(ready)}
          onChange={(typed) => {
            setText(typed);
            setRefused(undefined);
          }}
        />
        {initial !== undefined && !changed ? null : (
          <MmButton
            label="Save"
            name={saves === undefined ? undefined : `Save ${saves}`}
            kind={saveKind}
            onPress={ready === undefined ? undefined : () => void save(ready)}
          />
        )}
      </div>
      <p id={hintId} className="mm-number-entry-hint">
        {hint}
      </p>
    </div>
  );
}
