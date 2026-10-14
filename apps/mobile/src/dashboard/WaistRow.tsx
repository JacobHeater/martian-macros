import type { Fmt } from '../format/Fmt';
import { MmListRow } from '../ui/MmListRow';
import { NumberEntry } from '../ui/NumberEntry';

interface WaistRowProps {
  fmt: Fmt;
  /** The last measurement and when, said under the title; undefined before the first. */
  last: string | undefined;
  /** Saves one reading, in centimeters. If it fails, "That value looks off" is said under the field. */
  onSaveWaist: (cm: number) => Promise<void>;
}

/**
 * With no waist measurement that still counts, the Dashboard asks for one
 * in the slot the answer takes (MM-301), as it asks for the weigh-in
 * (MM-291): the tape icon and "Waist", one field, Save and how to measure,
 * when included (MM-155). Save is secondary: the waist is weekly and the
 * weigh-in above may hold the screen's one primary. One reading is kept as
 * it is; the three whose middle is kept are in Progress. Once saved, the
 * waist row takes its place.
 */
export function WaistRow({ fmt, last, onSaveWaist }: WaistRowProps) {
  return (
    <MmListRow
      leadingIcon="tape"
      title="Waist"
      subtitle={last ?? 'Once a week is enough'}
      entry={
        <NumberEntry
          title={`Today’s waist, ${fmt.imperial ? 'inches' : 'centimeters'}`}
          unit={fmt.lengthUnit}
          initial={undefined}
          hint="Morning, before eating. Tape level with the navel, snug, breathe out normally."
          saves="waist"
          saveKind="secondary"
          onSave={(value) => onSaveWaist(fmt.lengthToCm(value))}
        />
      }
    />
  );
}
