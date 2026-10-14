import type { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/integration/Clock';
import type { WaterWriter } from '../domain/repositories/WaterWriter';
import { WaterEntry } from '../domain/water/WaterEntry';

/** Logs `ml` of water on `date`, at the clock's time, and returns the entry's id (MM-313). */
export function logWater(water: WaterWriter, clock: Clock, date: CalendarDate, ml: number): Promise<number> {
  return water.addWater(new WaterEntry({ id: 0, date, ml, at: clock.now() }));
}
