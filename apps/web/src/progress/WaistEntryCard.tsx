import { useState } from 'react';
import { parseNumber } from '../format/parseNumber';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

interface WaistEntryCardProps {
  /** The unit the readings are typed in, in words: "inches". */
  unit: string;
  /** What is known so far, under the fields; undefined before any measurement. */
  summary: string | undefined;
  /** Saves one reading or three, in the user's unit. If it fails, the card says "That value looks off". */
  onSave: (readings: readonly number[]) => Promise<void>;
}

const places = ['1st', '2nd', '3rd'] as const;

/**
 * The waist measurement card (MM-155): three readings, of which the middle
 * one is kept, or one reading for a quick entry.
 */
export function WaistEntryCard({ unit, summary, onSave }: WaistEntryCardProps) {
  const overlays = useOverlays();
  const [readings, setReadings] = useState<readonly string[]>(['', '', '']);
  const typed = readings.filter((text) => text.trim() !== '').map((text) => parseNumber(text));
  const valid = typed.filter((value): value is number => value !== undefined && value > 0);
  const ready = valid.length === typed.length && (valid.length === 1 || valid.length === 3);

  const save = async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await onSave(valid);
      setReadings(['', '', '']);
    } catch {
      overlays.snack('That value looks off. Check it.');
    }
  };

  let note = `Take three readings in ${unit}. The middle one is kept.`;
  if (typed.length === 2) note = 'Enter one reading or all three.';
  else if (valid.length === 1 && typed.length === 1) {
    note =
      'One reading is kept as it is. It is noisier than the middle of three, so a change takes longer to show.';
  }
  return (
    <InfoCard title="Waist">
      <div className="progress-waist-fields">
        {places.map((place, i) => (
          // Short enough to fit three across a phone; the unit is said once, under the fields.
          <MmTextField
            key={place}
            label={place}
            name={`${place} waist reading`}
            kind="number"
            dense
            value={readings[i] ?? ''}
            onChange={(text) => setReadings(readings.map((reading, at) => (at === i ? text : reading)))}
          />
        ))}
      </div>
      <div className="progress-waist-save">
        <p className="app-caption progress-waist-note">{note}</p>
        <MmButton label="Save" onPress={ready ? () => void save() : undefined} />
      </div>
      {summary === undefined ? null : <p className="app-text">{summary}</p>}
      <p className="app-caption">
        First thing in the morning, after the bathroom, before eating. Stand relaxed and breathe out normally. Keep the
        tape level with the navel, snug and not pressing in, and use the same tape each time. Once a week is enough.
      </p>
    </InfoCard>
  );
}
