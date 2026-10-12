import { CalorieBand } from './CalorieBand';
import type { IntakeStanding } from './IntakeStanding';

/**
 * The standing of `kcal` against `targetKcal`. An intake below `floorKcal`,
 * the lowest the app would ever suggest, is below the floor whatever the
 * band says (MM-114, MM-149).
 */
export function intakeStandingOf({
  kcal,
  targetKcal,
  floorKcal,
}: {
  kcal: number;
  targetKcal: number;
  floorKcal?: number | undefined;
}): IntakeStanding {
  if (floorKcal !== undefined && kcal < floorKcal) return 'belowFloor';
  const band = new CalorieBand(targetKcal);
  if (band.contains(kcal)) return 'onTarget';
  return kcal < band.lowKcal ? 'below' : 'above';
}
