import { type ReactNode, useEffect, useRef, useState } from 'react';
import { parseNumber } from '../format/parseNumber';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmSection } from '../ui/MmSection';
import { MmTextField } from '../ui/MmTextField';
import { WaistProtocolFigure } from '../ui/WaistProtocolFigure';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

interface WaistEntryCardProps {
  /** The unit the readings are typed in, in words: "inches". */
  unit: string;
  /** What is known so far, as the section's one line; undefined before any measurement. */
  summary: string | undefined;
  /** Today's waist as recorded ("36 in"), when it is (MM-304): the section says that saving again replaces it. */
  recordedToday?: string | undefined;
  /** How many measurements there are: the protocol is drawn in full for the first three (MM-155). */
  entries: number;
  /** The waist over time under the entry (MM-155), or what it waits for before the first measurement (MM-578). */
  chart?: ReactNode;
  /** Saves one reading or three, in the user's unit. If it fails, the section says "That value looks off". */
  onSave: (readings: readonly number[]) => Promise<void>;
}

const places = ['1st', '2nd', '3rd'] as const;

/** How many measurements the protocol is drawn in full for; from then on it is one tap down. */
const protocolShownFor = 3;

const steps = [
  'First thing in the morning, after the bathroom, before eating.',
  'Standing, relaxed, at the end of a normal breath out.',
  'Tape level with the navel, snug and not pressing in.',
  'The same tape each time. Once a week is enough.',
] as const;

/**
 * The waist section (MM-155, MM-257): folded to its one line, it opens to
 * how to measure (drawn and in words for the first three measurements,
 * then under "How to measure"), three fields of which the middle reading
 * is kept (or one for a quick entry), Save as a quiet action, and the
 * chart of the record so far.
 */
export function WaistEntryCard({ unit, summary, recordedToday, entries, chart, onSave }: WaistEntryCardProps) {
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
  const protocol = (
    <div className="progress-waist-protocol">
      <WaistProtocolFigure />
      <ol className="progress-waist-steps">
        {steps.map((step) => (
          <li key={step} className="app-caption progress-waist-step">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
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
      {entries < protocolShownFor ? (
        protocol
      ) : (
        <MmDisclosure title="How to measure" subtitle="Morning, relaxed, tape level with the navel">
          {protocol}
        </MmDisclosure>
      )}
      <MmListGroup>
        <MmListRow
          title="Today’s waist"
          subtitle={note}
          entry={
            <>
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
                <MmButton label="Save" name="Save waist" kind="secondary" onPress={ready ? () => void save() : undefined} />
              </div>
            </>
          }
        />
      </MmListGroup>
      {chart}
    </MmSection>
  );
}
