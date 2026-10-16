import { tryParseDouble } from '../../../lang/tryParseDouble';
import type { Micronutrient } from '../micros/Micronutrient';
import { Micronutrients } from '../micros/Micronutrients';
import { LabelReading } from './LabelReading';

/**
 * Reads the US Nutrition Facts layout from recognised `text` (MM-44): serving
 * size, calories, total fat, total carbohydrate, protein, and where present
 * fiber, sodium and the micronutrients of MM-309.
 *
 * It is deliberately plain. It finds each label's first number after the
 * label, tolerating the line breaks a text recogniser inserts and the
 * look-alike characters it confuses with digits. It cannot read a panel
 * whose labels and values are in separate columns, and it never fills a
 * field it did not find. The caller reviews everything it returns.
 */
export function parseNutritionLabel(text: string): LabelReading {
  const t = clean(text);
  return new LabelReading({
    servingText: servingText(t),
    servingGrams: servingGrams(t),
    kcal: numberAfter(t, String.raw`calories(?!\s*from)`),
    fatG: numberAfter(t, String.raw`total\s*fat`),
    carbsG: numberAfter(t, String.raw`total\s*carb\w*\.?`),
    proteinG: numberAfter(t, String.raw`protein`),
    fiberG: numberAfter(t, String.raw`(?:dietary\s*)?fiber`),
    sodiumMg: numberAfter(t, String.raw`sodium`),
    micros: new Micronutrients(
      Object.fromEntries(lines.map(([nutrient, label, unit]) => [nutrient, amountAfter(t, label, unit)])),
    ),
  });
}

const vitamin = (letter: string) => String.raw`vit(?:amin|\.)?\s*` + letter + String.raw`\b`;

/**
 * The lines read only with an amount and its unit (MM-309): a line printed
 * with a percent alone is left unread, never converted through a Daily
 * Value the label may not have used. Vitamin D printed in IU is converted
 * (40 IU to the microgram).
 */
const lines: readonly (readonly [Exclude<Micronutrient, 'sodium'>, string, 'g' | 'mg' | 'mcg'])[] = [
  ['saturatedFat', String.raw`sat(?:urated|\.)?\s*fat`, 'g'],
  ['cholesterol', String.raw`cholesterol`, 'mg'],
  ['sugars', String.raw`(?<!added\s{0,3})(?:total\s*)?sugars?`, 'g'],
  ['vitaminD', vitamin('d'), 'mcg'],
  ['calcium', String.raw`calcium`, 'mg'],
  ['iron', String.raw`iron`, 'mg'],
  ['potassium', String.raw`potassium`, 'mg'],
  ['magnesium', String.raw`magnesium`, 'mg'],
  ['zinc', String.raw`zinc`, 'mg'],
  ['vitaminA', vitamin('a'), 'mcg'],
  ['vitaminC', vitamin('c'), 'mg'],
  ['vitaminB12', vitamin(String.raw`b\s*12`), 'mcg'],
  ['folate', String.raw`folate`, 'mcg'],
];

/** The amount after `label` when its unit follows it ("Iron 8mg"), or undefined. */
function amountAfter(t: string, label: string, unit: 'g' | 'mg' | 'mcg'): number | undefined {
  const units = unit === 'mcg' ? String.raw`(mcg|µg|ug|iu)` : unit === 'mg' ? '(mg)' : '(g)';
  const m = new RegExp(label + String.raw`[\s:.\-]*(\d+(?:[.,]\d+)?)\s*` + units + String.raw`(?![a-z])`).exec(digits(t));
  const found = m?.[1];
  if (found === undefined) return undefined;
  const value = tryParseDouble(found.replaceAll(',', '.'));
  if (value === undefined) return undefined;
  return m?.[2] === 'iu' ? value / 40 : value;
}

function clean(text: string): string {
  return text
    .replaceAll('\r', '\n')
    .replace(/[ \t]+/g, ' ')
    .toLowerCase();
}

/**
 * Digits only after fixing the letters a recogniser mistakes for them, and
 * only when they sit next to other digits.
 */
function digits(s: string): string {
  return s.replace(/(?<=\d)[oO](?=\d|\b)|(?<=\b)[oO](?=\d)/g, '0').replace(/(?<=\d)[l|](?=\d)/g, '1');
}

function numberAfter(t: string, label: string): number | undefined {
  const m = new RegExp(label + String.raw`[\s:.\-]*(\d+(?:[.,]\d+)?)`).exec(digits(t));
  const found = m?.[1];
  return found === undefined ? undefined : tryParseDouble(found.replaceAll(',', '.'));
}

function servingLine(t: string): string | undefined {
  return /serving\s*size[\s:]*([^\n]+)/.exec(t)?.[1];
}

function servingText(t: string): string | undefined {
  const text = servingLine(t)?.trim();
  return text === undefined || text.length === 0 ? undefined : text;
}

function servingGrams(t: string): number | undefined {
  const line = servingLine(t);
  if (line === undefined) return undefined;
  const g = /\(?\s*(\d+(?:\.\d+)?)\s*g\b/.exec(line)?.[1];
  return g === undefined ? undefined : tryParseDouble(g);
}
