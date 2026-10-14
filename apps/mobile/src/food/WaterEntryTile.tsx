import type { UnitSystem } from '../domain/UnitSystem';
import type { WaterEntry } from '../domain/water/WaterEntry';
import { waterAmount } from '../format/waterAmount';
import { MmIcon } from '../ui/MmIcon';
import { waterEntryWhen } from './waterEntryWhen';
import './food.css';

/**
 * One drink of water, laid out as a meal's food row (MM-318): the icon, the
 * name with when it was had under it (MM-319), and the amount on the right
 * where a food has its energy.
 */
export function WaterEntryTile({ entry, units }: { entry: WaterEntry; units: UnitSystem }) {
  return (
    <span className="food-entry">
      <span className="food-entry-method" aria-hidden="true">
        <MmIcon name="water" size={20} />
      </span>
      <span className="food-entry-text">
        <span className="food-entry-name">Water</span>
        <span className="food-entry-line">{waterEntryWhen(entry)}</span>
      </span>
      <span className="food-entry-kcal">{waterAmount(entry.ml, units)}</span>
    </span>
  );
}
