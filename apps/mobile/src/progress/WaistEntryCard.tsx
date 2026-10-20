import { useEffect, useRef, useState } from 'react';
import { waistProtocolText } from '../format/waistProtocolText';
import { parseNumber } from '../format/parseNumber';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

interface WaistEntryCardProps {
  /** The unit the readings are typed in, in words: "inches". */
  unit: string;
  /** What is known so far, as the section's one line; undefined before any measurement. */
  summary: string | undefined;
  /** Today's waist as recorded ("36 in"), when it is (MM-304): the section says that saving again replaces it. */
  recordedToday?: string | undefined;
  /** Saves one reading or three, in the user's unit. If it fails, the section says "That value looks off". */
  onSave: (readings: readonly number[]) => Promise<void>;
}

const places = ['1st', '2nd', '3rd'] as const;

/**
 * The waist section (MM-155, MM-257): folded to its one line, it opens to
 * how to measure, three fields of which the middle reading is kept (or one
 * for a quick entry), and Save as a quiet action.
 */
export function WaistEntryCard({ unit, summary, recordedToday, onSave }: WaistEntryCardProps) {
  const overlays = useOverlays();
  const [readings, setReadings] = useState<readonly string[]>(['', '', '']);
  // After a save, the line saying what is recorded takes focus once it shows the new value (the panel's F5).
  const [focusRecorded, setFocusRecorded] = useState(false);
  const recordedLine = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!focusRecorded || recordedToday === undefined) return;
    recordedLine.current?.focus();
    setFocusRecorded(false);
  }, [focusRecorded, recordedToday]);
  const typed = readings.filter((text) => text.trim() !== '').map((text) => parseNumber(text));
  const valid = typed.filter((value): value is number => value !== undefined && value > 0);
  const ready = valid.length === typed.length && (valid.length === 1 || valid.length === 3);

  const save = async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    try {
      await onSave(valid);
      setReadings(['', '', '']);
      setFocusRecorded(true);
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
    <MmSection
      icon="tape"
      title="Waist"
      summary={summary ?? 'Not measured yet. Once a week is enough.'}
      collapsible
      initiallyExpanded={false}
      remember="progress.waist"
    >
      {recordedToday === undefined ? null : (
        <p ref={recordedLine} tabIndex={-1} className="app-caption progress-waist-today">Today’s waist is recorded: {recordedToday}. Saving again replaces it.</p>
      )}
      <p className="app-caption progress-waist-how">{waistProtocolText}</p>
      <div className="progress-waist-fields">
        {places.map((place, i) => (
          // Short enough to fit three across a phone; the unit is said once, under the fields.
          <MmTextField
            key={place}
            label={place}
            name={`${place} waist reading, ${unit}`}
            kind="number"
            dense
            value={readings[i] ?? ''}
            onChange={(text) => setReadings(readings.map((reading, at) => (at === i ? text : reading)))}
          />
        ))}
      </div>
      <div className="progress-waist-save">
        <p className="app-caption progress-waist-note">{note}</p>
        <MmButton label="Save" kind="secondary" onPress={ready ? () => void save() : undefined} />
      </div>
    </MmSection>
  );
}
