import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { Fmt } from './Fmt';

/**
 * What the scale will do after leaving a deficit (MM-130), said before it
 * does it: about half a kilogram to two over a week or two, as stored
 * carbohydrate and water return, not fat.
 */
export function reboundText(fmt: Fmt): string {
  const whole = (kg: number) => roundHalfAwayFromZero(fmt.weightFromKg(kg)) + 0;
  return (
    `Expect the scale to rise ${whole(0.5)} to ${whole(2)} ${fmt.weightUnit} over the next week or two. ` +
    'That is stored carbohydrate and water returning, not fat. Your trend will settle.'
  );
}
