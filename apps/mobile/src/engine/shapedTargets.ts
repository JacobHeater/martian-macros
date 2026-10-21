import { CarbFatBalance } from '../domain/CarbFatBalance';
import type { TargetShape } from '../domain/TargetShape';
import { WeekShape } from '../domain/WeekShape';
import { DailyTargets } from './DailyTargets';
import { shapeWeek } from './shapeWeek';
import { splitCarbsAndFat } from './splitCarbsAndFat';
import type { TargetShapeLimits } from './TargetShapeLimits';

/**
 * A day's targets with the user's shape applied (MM-122, MM-124): the
 * check-in's flat targets split by the balance of carbohydrate and fat
 * (Balanced until one is chosen, MM-486), then
 * moved to the week's higher or lower day. Protein and its minimum are the
 * same every day; the day's difference is carried by carbohydrate, then fat
 * down to its minimum. It depends only on the plan and the day of the week,
 * never on what was eaten: going over is not taken back, and going under is
 * not banked (MM-92).
 */
export function shapedTargets({
  targets,
  weekday,
  shape,
  limits,
}: {
  targets: DailyTargets;
  weekday: number;
  shape: TargetShape | undefined;
  limits: TargetShapeLimits;
}): DailyTargets {
  // Until the user chooses, a day is Balanced (MM-486); the check-in issues MM-24's split.
  const balance = shape?.balance ?? CarbFatBalance.balanced;
  const weekShape = shape?.week ?? WeekShape.flat;
  const { proteinG } = targets;
  const flat = splitCarbsAndFat({ kcal: targets.kcal, proteinG, fatMinimumG: limits.fatMinimumG(targets.kcal), balance });
  const week = shapeWeek({ flatKcal: targets.kcal, floorKcal: limits.floorKcal, week: weekShape });
  const kcal = weekShape.higherDays.has(weekday) ? week.higherKcal : week.lowerKcal;
  const fatMinimumG = limits.fatMinimumG(kcal);
  let fatG = Math.max(flat.fatG, fatMinimumG);
  let carbsG = (kcal - 4 * proteinG - 9 * fatG) / 4;
  if (kcal < targets.kcal) {
    // A lower day takes carbohydrate down to the floor first, then fat to its minimum; then the floor gives way.
    const floorG = balance.carbFloorOff ? 0 : CarbFatBalance.carbFloorG;
    carbsG = Math.max(Math.min(flat.carbsG, floorG), flat.carbsG + (kcal - targets.kcal) / 4);
    fatG = (kcal - 4 * proteinG - 4 * carbsG) / 9;
    if (fatG < fatMinimumG) {
      fatG = fatMinimumG;
      carbsG = (kcal - 4 * proteinG - 9 * fatG) / 4;
    }
  }
  return new DailyTargets({
    kcal,
    proteinG,
    proteinMinimumG: targets.proteinMinimumG,
    fatG,
    carbsG: Math.max(0, carbsG),
    weeklyRateFraction: targets.weeklyRateFraction,
    flags: targets.flags,
  });
}
