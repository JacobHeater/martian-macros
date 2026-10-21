import type { UnitSystem } from '../domain/UnitSystem';
import { Fmt } from '../format/Fmt';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { SectionLabel } from '../ui/SectionLabel';
import type { MeasurementsTyped } from './MeasurementsTyped';
import type { WeightFromHealth } from './WeightFromHealth';
import { WeightFromHealthRows } from './WeightFromHealthRows';

interface MeasurementsStepProps {
  units: UnitSystem;
  typed: MeasurementsTyped;
  onUnits: (units: UnitSystem) => void;
  onTyped: (typed: MeasurementsTyped) => void;
  /** The health platform's offer, where there is one on this phone (MM-68, MM-73). */
  health?: WeightFromHealth | undefined;
}

/**
 * Step 3: units, height and current weight. Where the phone has a health
 * platform, reading weight from it is offered under the weight, never
 * required, and today's weigh-in from it is offered as the current weight.
 */
export function MeasurementsStep({ units, typed, onUnits, onTyped, health }: MeasurementsStepProps) {
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
      {/* Said when it changes, as the offer under it does, since the row pressed goes away (the panel's review). */}
      <p className="app-caption" aria-live="polite">
        {health?.used === true && health.today !== undefined
          ? `Today’s weigh-in from ${health.today.sourceName === '' ? health.platform : health.today.sourceName}, in ${health.platform}. Type to change it.`
          : 'This becomes your first weigh-in.'}
      </p>
      <div aria-live="polite">{health === undefined ? null : <WeightFromHealthRows health={health} fmt={fmt} />}</div>
    </>
  );
}

