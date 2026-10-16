import type { UnitSystem } from '../domain/UnitSystem';
import type { Overlays } from '../ui/Overlays';
import { AddWaterSheet } from './AddWaterSheet';

/**
 * Opens the Add water sheet (MM-318), or Edit water with `editingMl`, and
 * gives the millilitres chosen, or undefined when it is left.
 */
export function showAddWaterSheet(
  overlays: Overlays,
  units: UnitSystem,
  dayName: string,
  editingMl?: number,
): Promise<number | undefined> {
  return overlays.sheet<number>(editingMl === undefined ? 'Add water' : 'Edit water', (close) => (
    <AddWaterSheet units={units} dayName={dayName} editingMl={editingMl} onAdd={(ml) => close(ml)} />
  ));
}
