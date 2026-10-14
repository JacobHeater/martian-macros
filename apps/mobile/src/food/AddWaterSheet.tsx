import type { UnitSystem } from '../domain/UnitSystem';
import { WaterServing } from '../domain/water/WaterServing';
import { WaterUnits } from '../domain/water/WaterUnits';
import { FormatError } from '../lang/FormatError';
import { quantityText } from '../format/quantityText';
import { waterServingLabel } from '../format/waterServingLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmButton } from '../ui/MmButton';
import { NumberEntry } from '../ui/NumberEntry';
import { SectionLabel } from '../ui/SectionLabel';
import './food.css';

interface AddWaterSheetProps {
  units: UnitSystem;
  /** "Today", "Yesterday", "Mon, Oct 12": the day the water goes to. */
  dayName: string;
  /** The amount of the drink being edited, in millilitres; absent when adding one. */
  editingMl?: number | undefined;
  /** Called with the millilitres chosen; the sheet is then closed by its opener. */
  onAdd: (ml: number) => void;
}

/**
 * What the Water section's "+" opens (MM-318), as a meal's "+" opens the
 * Add food sheet: a glass or a bottle, each saying its size, or another
 * amount typed. Choosing one adds it and closes the sheet. Pressing a drink
 * opens it as "Edit water", as pressing a food opens "Edit food": its amount
 * in the field, to change.
 */
export function AddWaterSheet({ units, dayName, editingMl, onAdd }: AddWaterSheetProps) {
  const imperial = units === 'imperial';
  const editing = editingMl !== undefined;
  const limit = imperial ? 'Up to 101 fl oz at a time.' : 'Up to 3,000 ml at a time.';
  const shown = (ml: number) => quantityText(imperial ? roundHalfAwayFromZero(WaterUnits.mlToFlOz(ml)) : roundHalfAwayFromZero(ml));
  return (
    <div className="food-sheet">
      <h2 className="app-headline">{editing ? 'Edit water' : 'Add water'}</h2>
      <p className="app-caption app-muted">{dayName}</p>
      {editing ? null : (
        <div className="food-water-actions">
          {WaterServing.values.map((serving) => (
            <MmButton
              key={serving}
              label={waterServingLabel(serving, units)}
              name={`${waterServingLabel(serving, units)} of water`}
              kind="secondary"
              onPress={() => onAdd(WaterServing.ml(serving, units))}
            />
          ))}
        </div>
      )}
      <div className={editing ? undefined : 'food-water-other'}>
        {editing ? null : <SectionLabel text="Other amount" />}
        <NumberEntry
          title={`Water, ${imperial ? 'fluid ounces' : 'millilitres'}`}
          unit={imperial ? 'fl oz' : 'ml'}
          initial={editing ? shown(editingMl) : undefined}
          hint={limit}
          refusal="That is more than one drink can be."
          saves="water"
          saveKind={editing ? 'primary' : 'secondary'}
          onSave={async (value) => {
            const ml = imperial ? WaterUnits.flOzToMl(value) : value;
            if (!(ml > 0 && ml <= WaterUnits.maxEntryMl)) throw new FormatError('Out of range');
            onAdd(ml);
          }}
        />
      </div>
    </div>
  );
}
