import { useState } from 'react';
import { parseNumber } from '../format/parseNumber';
import { InfoCard } from './InfoCard';
import { MmButton } from './MmButton';
import { MmTextField } from './MmTextField';
import './ui.css';

interface NumberEntryCardProps {
  title: string;
  unit: string;
  initial: string | undefined;
  hint: string;
  /** Saves the value; if it fails, the card says "That value looks off" under the field. */
  onSave: (value: number) => Promise<void>;
}

/**
 * A card for entering one number (a weigh-in, a waist measurement), with a
 * save button and a hint. What is wrong with a value is said under the
 * field, and the keyboard stays in it (MM-279).
 */
export function NumberEntryCard({ title, unit, initial, hint, onSave }: NumberEntryCardProps) {
  const [text, setText] = useState(initial ?? '');
  const [refused, setRefused] = useState<string>();
  const value = parseNumber(text);
  const changed = text !== (initial ?? '');
  const notANumber = text.trim() !== '' && (value === undefined || value <= 0) ? 'Enter a number above zero.' : undefined;

  const save = async (toSave: number) => {
    try {
      await onSave(toSave);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    } catch {
      setRefused('That value looks off. Check it.');
    }
  };

  return (
    <InfoCard title={title}>
      <div className="mm-number-entry">
        <MmTextField
          name={title}
          kind="number"
          suffix={unit}
          dense
          value={text}
          error={refused ?? notANumber}
          onChange={(typed) => {
            setText(typed);
            setRefused(undefined);
          }}
        />
        <MmButton
          label="Save"
          onPress={value === undefined || value <= 0 || !changed ? undefined : () => void save(value)}
        />
      </div>
      <p className="mm-number-entry-hint">{hint}</p>
    </InfoCard>
  );
}
