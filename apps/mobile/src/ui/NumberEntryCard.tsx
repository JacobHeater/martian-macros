import { useState } from 'react';
import { parseNumber } from '../format/parseNumber';
import { InfoCard } from './InfoCard';
import { MmButton } from './MmButton';
import { MmTextField } from './MmTextField';
import { useOverlays } from './useOverlays';
import './ui.css';

interface NumberEntryCardProps {
  title: string;
  unit: string;
  initial: string | undefined;
  hint: string;
  /** Saves the value; if it fails, the card says "That value looks off". */
  onSave: (value: number) => Promise<void>;
}

/**
 * A card for entering one number (a weigh-in, a waist measurement), with a
 * save button and a hint.
 */
export function NumberEntryCard({ title, unit, initial, hint, onSave }: NumberEntryCardProps) {
  const [text, setText] = useState(initial ?? '');
  const overlays = useOverlays();
  const value = parseNumber(text);
  const changed = text !== (initial ?? '');

  const save = async (toSave: number) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await onSave(toSave);
    } catch {
      overlays.snack('That value looks off. Check it.');
    }
  };

  return (
    <InfoCard title={title}>
      <div className="mm-number-entry">
        <MmTextField name={title} kind="number" suffix={unit} dense value={text} onChange={setText} />
        <MmButton
          label="Save"
          onPress={value === undefined || value <= 0 || !changed ? undefined : () => void save(value)}
        />
      </div>
      <p className="mm-number-entry-hint">{hint}</p>
    </InfoCard>
  );
}
