import type { Fmt } from '../format/Fmt';
import { MmSection } from '../ui/MmSection';
import { NumberEntry } from '../ui/NumberEntry';

interface WeighInSectionProps {
  fmt: Fmt;
  onSaveWeight: (kg: number) => Promise<void>;
}

/**
 * With no weigh-in today, the Dashboard asks for one in place (MM-254):
 * the one field a row cannot hold, so it is a section with the scale icon
 * and the field beneath. Once saved, the weight row takes its place.
 */
export function WeighInSection({ fmt, onSaveWeight }: WeighInSectionProps) {
  return (
    <MmSection icon="scale" title="Weigh-in">
      <NumberEntry
        title="Today’s weigh-in"
        unit={fmt.weightUnit}
        initial={undefined}
        hint="First thing in the morning, after the bathroom."
        onSave={(value) => onSaveWeight(fmt.weightToKg(value))}
      />
    </MmSection>
  );
}
