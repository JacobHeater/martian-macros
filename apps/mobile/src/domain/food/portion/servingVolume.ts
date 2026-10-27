import { parseQuantity } from './parseQuantity';
import { PortionUnit } from './PortionUnit';

/** The volume words a source's serving may begin with, and their unit. */
const units: readonly (readonly [RegExp, PortionUnit | 'liter'])[] = [
  [/^(?:cups?|c)$/, 'cup'],
  [/^(?:tablespoons?|tbsps?|tbs)$/, 'tablespoon'],
  [/^(?:teaspoons?|tsps?)$/, 'teaspoon'],
  [/^(?:fl\.?\s*oz|fluid\s+ounces?)$/, 'fluidOunce'],
  [/^(?:ml|millilit(?:er|re)s?)$/, 'milliliter'],
  [/^(?:l|lit(?:er|re)s?)$/, 'liter'],
];

const amount = String.raw`(\d+\s+\d+\s*/\s*\d+|\d+\s*/\s*\d+|\d+(?:[.,]\d+)?)`;
const word = String.raw`(cups?|c|tablespoons?|tbsps?|tbs|teaspoons?|tsps?|fl\.?\s*oz|fluid\s+ounces?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)`;
/** "1 cup, chopped", "1/2 cup", "2 tbsp", "8 fl oz", "1 1/2 cups": a measure at the start. */
const leading = new RegExp(String.raw`^\s*${amount}\s*${word}\b`, 'i');
/** "(240 ml)", "(240mL)": a volume the source states in millilitres, anywhere. */
const statedMl = /\(\s*(\d+(?:[.,]\d+)?)\s*(?:ml|millilit(?:er|re)s?)\s*\)/i;

/**
 * The millilitres a source's serving holds, read from its own words
 * (MM-636): "1 cup, chopped" is 236.6 mL, "2 tbsp" 29.6 mL, and "1 cup
 * (240 ml)" the 240 mL it states. Undefined for a serving that is not a
 * measure of volume ("1 medium", "1 slice", "100 g"). The serving's gram
 * weight, the source's own for that form of the food, then lets other
 * volumes be weighed through it (MM-167): nothing is guessed.
 */
export function servingVolume(description: string): number | undefined {
  const stated = statedMl.exec(description);
  if (stated?.[1] !== undefined) {
    const ml = Number(stated[1].replace(',', '.'));
    return ml > 0 ? ml : undefined;
  }
  const match = leading.exec(description);
  if (match === null || match[1] === undefined || match[2] === undefined) return undefined;
  const count = parseQuantity(match[1]);
  const name = match[2].toLowerCase().replace(/\s+/g, ' ');
  const unit = units.find(([pattern]) => pattern.test(name))?.[1];
  if (count === undefined || unit === undefined) return undefined;
  const each = unit === 'liter' ? 1000 : PortionUnit.milliliters(unit);
  return each === undefined ? undefined : count * each;
}
