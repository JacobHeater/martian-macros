import type { Fmt } from '../format/Fmt';
import { MmListRow } from '../ui/MmListRow';
import { NumberEntry } from '../ui/NumberEntry';

interface WeighInRowProps {
  fmt: Fmt;
  /** The trend as it stands before today's weigh-in, said under the title (MM-298). */
  lastTrendKg: number | undefined;
  onSaveWeight: (kg: number) => Promise<void>;
}

/**
 * With no weigh-in today, the Dashboard asks for one in the slot the
 * answer takes (MM-291): the first row of its list group, the scale icon
 * and "Weigh-in" with the field, Save and hint beneath, inside the row's
 * padding, with the last trend under the title (MM-298). Once saved, the
 * trend weight row takes its place.
 */
export function WeighInRow({ fmt, lastTrendKg, onSaveWeight }: WeighInRowProps) {
  return (
    <MmListRow
      leadingIcon="scale"
      title="Weigh-in"
      subtitle={lastTrendKg === undefined ? undefined : `Trend so far ${fmt.weight(lastTrendKg)}`}
      entry={
        <NumberEntry
          title="Today’s weigh-in"
          unit={fmt.weightUnit}
          initial={undefined}
          hint="First thing in the morning, after the bathroom."
          onSave={(value) => onSaveWeight(fmt.weightToKg(value))}
        />
      }
    />
  );
}
