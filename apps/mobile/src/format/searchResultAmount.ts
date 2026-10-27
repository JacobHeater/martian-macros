import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

const whole = (value: number) => `${roundHalfAwayFromZero(value) + 0}`;

/**
 * What a found food's row says of its amount (MM-627): its first serving
 * and that serving's calories, then the calories per 100 g for comparing,
 * "1 cup (158 g) · 205 kcal (130 per 100 g)"; per 100 g alone when it has
 * no serving. A serving that is only a weight ("28.0 g") is said once.
 */
export function searchResultAmount(kcalPer100g: number, serving: { readonly description: string; readonly grams: number } | undefined): string {
  if (serving === undefined || !(serving.grams > 0)) return `${whole(kcalPer100g)} kcal per 100 g`;
  const weightOnly = /^\d+(?:\.\d+)?\s*g$/i.test(serving.description.trim());
  const named = weightOnly ? `${whole(serving.grams)} g` : `${serving.description} (${whole(serving.grams)} g)`;
  return `${named} · ${whole((kcalPer100g * serving.grams) / 100)} kcal (${whole(kcalPer100g)} per 100 g)`;
}
