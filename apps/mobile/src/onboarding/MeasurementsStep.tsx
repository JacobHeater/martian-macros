import type { UnitSystem } from '../domain/UnitSystem';
import { Fmt } from '../format/Fmt';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { SectionLabel } from '../ui/SectionLabel';
import type { MeasurementsTyped } from './MeasurementsTyped';

interface MeasurementsStepProps {
  units: UnitSystem;
  typed: MeasurementsTyped;
  onUnits: (units: UnitSystem) => void;
  onTyped: (typed: MeasurementsTyped) => void;
}

/** Step 3: units, height and current weight. */
export function MeasurementsStep({ units, typed, onUnits, onTyped }: MeasurementsStepProps) {
  const fmt = new Fmt(units);
  const field = (key: keyof MeasurementsTyped, label: string) => (
    <MmTextField label={label} kind="number" value={typed[key]} onChange={(value) => onTyped({ ...typed, [key]: value })} />
  );
  return (
    <>
      <h1 className="app-headline">Your measurements</h1>
      <div className="app-gap-small" />
      <MmSegmented<UnitSystem>
        name="Units"
        segments={[
          { value: 'imperial', label: 'lb / ft' },
          { value: 'metric', label: 'kg / cm' },
        ]}
        selected={units}
        onChange={(chosen) => {
          if (chosen !== undefined) onUnits(chosen);
        }}
      />
      <div className="app-gap" />
      <SectionLabel text="Height" />
      {fmt.imperial ? (
        <div className="app-row app-row-even">
          {field('feet', 'Feet')}
          {field('inches', 'Inches')}
        </div>
      ) : (
        field('cm', 'Centimeters')
      )}
      <div className="app-gap" />
      <SectionLabel text="Current weight" />
      {field('weight', fmt.weightUnit)}
      <p className="app-caption">This becomes your first weigh-in.</p>
    </>
  );
}
