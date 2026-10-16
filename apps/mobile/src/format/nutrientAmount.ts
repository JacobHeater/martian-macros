import { Micronutrient } from '../domain/food/micros/Micronutrient';
import { groupThousands } from '../lang/groupThousands';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/**
 * An amount of `nutrient` in its unit (MM-310): whole numbers, except a
 * microgram amount under 10, which keeps one decimal ("2.4 µg").
 */
export function nutrientAmount(nutrient: Micronutrient, amount: number): string {
  const unit = Micronutrient.unit(nutrient);
  const figure =
    unit === 'µg' && Math.abs(amount) < 10
      ? toStringAsFixed(amount, 1).replace(/\.0$/, '')
      : groupThousands(roundHalfAwayFromZero(amount) + 0);
  return `${figure} ${unit}`;
}
