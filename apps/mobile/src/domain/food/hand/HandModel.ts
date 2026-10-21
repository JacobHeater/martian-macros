import type { BiologicalSex } from '../../BiologicalSex';
import type { NutritionTotals } from '../portion/NutritionTotals';
import type { PortionUnit } from '../portion/PortionUnit';
import { compositionDensity } from './compositionDensity';
import type { HandSize } from './HandSize';

const referenceHeightCm: Record<BiologicalSex, number> = { male: 178, female: 165 };

/** Millilitres of one portion at the reference height. */
const referenceMl: Partial<Record<PortionUnit, Record<BiologicalSex, number>>> = {
  palm: { male: 110, female: 85 },
  cuppedHand: { male: 130, female: 100 },
  thumb: { male: 15, female: 11 },
};

/**
 * The portions of a solid piece of food, whose density follows from its
 * makeup. A cupped hand is a heap with air in it, so it keeps its default.
 */
const solidPortions: ReadonlySet<PortionUnit> = new Set<PortionUnit>(['palm', 'thumb']);

/**
 * Grams per millilitre to use when the food has no density of its own:
 * cooked meat and fish are about 1.0, grains and fruit well under, fats
 * about 0.9. This is what each portion is *for*.
 */
const defaultDensity: Partial<Record<PortionUnit, number>> = {
  palm: 1.0,
  cuppedHand: 0.65,
  thumb: 0.9,
};

/** Volume of one `unit` for `hand`, or undefined if `unit` is not a hand unit. */
function millilitersOf(unit: PortionUnit, hand: HandSize): number | undefined {
  const reference = referenceMl[unit]?.[hand.sex];
  if (reference === undefined) return undefined;
  const scale = hand.heightCm / referenceHeightCm[hand.sex];
  return reference * scale * scale * scale;
}

/**
 * Turns a count of palms, cupped hands or thumbs into grams of a particular
 * food (MM-46).
 *
 * **This is judgement, not measurement.** The reference volumes are rounded
 * from common coaching guidance (a palm of cooked protein is about 85 to
 * 115 g, a cupped hand about half a cup) and have not been checked against
 * measured hands. Hand length follows height, so volume follows height cubed
 * from a reference person of each sex. The result is only ever used with the
 * method's stated uncertainty (25%, 30%, 40%), and a steady bias is absorbed
 * by the adaptive estimate. Change a number here and raise `version`.
 *
 * Version 2: a palm or thumb of a food with no stated density takes the
 * density of its makeup per 100 g (`compositionDensity`), so a palm of
 * salmon and a palm of chicken breast weigh differently.
 */
export const HandModel = {
  /** Stored with a hand-portion entry so old entries stay explicable. */
  version: 2,

  millilitersOf,

  /**
   * Grams in one `unit` of a food with `densityGPerMl`, or for a palm or a
   * thumb the density of its makeup `per100g`, or else the portion's
   * default; undefined if `unit` is not a hand unit.
   */
  gramsOf(
    unit: PortionUnit,
    hand: HandSize,
    { densityGPerMl, per100g }: { densityGPerMl?: number | undefined; per100g?: NutritionTotals | undefined } = {},
  ): number | undefined {
    const ml = millilitersOf(unit, hand);
    const fromMakeup = per100g !== undefined && solidPortions.has(unit) ? compositionDensity(per100g) : undefined;
    const density = densityGPerMl ?? fromMakeup ?? defaultDensity[unit];
    if (ml === undefined || density === undefined) return undefined;
    return ml * density;
  },
} as const;
