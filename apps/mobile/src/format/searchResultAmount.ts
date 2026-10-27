import type { CatalogBasis } from '../foodCatalog/CatalogBasis';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { per100Label } from './per100Label';

const whole = (value: number) => `${roundHalfAwayFromZero(value) + 0}`;

/**
 * What a found food's row says of its amount (MM-627): its first serving
 * and that serving's calories, then the calories per 100 g for comparing,
 * "1 cup (158 g) · 205 kcal (130 per 100 g)"; per 100 g alone when it has
 * no serving. A serving that is only a weight ("28.0 g") is said once. A
 * food stated per 100 mL (MM-650) is said in millilitres the same way: "1 can
 * (355 mL) · 149 kcal (42 per 100 mL)", the volume not repeated when the
 * serving's own words state it.
 */
export function searchResultAmount(kcalPer100: number, serving: CatalogServing | undefined, basis: CatalogBasis = 'per100g'): string {
  const per = per100Label(basis);
  const unit = basis === 'per100ml' ? 'mL' : 'g';
  const amount = basis === 'per100ml' ? serving?.milliliters : serving?.grams;
  if (serving === undefined || amount === undefined || !(amount > 0)) return `${whole(kcalPer100)} kcal ${per}`;
  const description = serving.description.trim();
  const amountOnly = new RegExp(String.raw`^\d+(?:\.\d+)?\s*${unit}$`, 'i').test(description);
  const stated = new RegExp(String.raw`\(\s*\d+(?:[.,]\d+)?\s*${unit}\s*\)`, 'i').test(description);
  const named = amountOnly ? `${whole(amount)} ${unit}` : stated ? description : `${description} (${whole(amount)} ${unit})`;
  return `${named} · ${whole((kcalPer100 * amount) / 100)} kcal (${whole(kcalPer100)} ${per})`;
}
