import { tryParseDouble } from '../../../lang/tryParseDouble';
import type { Micronutrient } from '../micros/Micronutrient';
import { Micronutrients } from '../micros/Micronutrients';
import type { LabelField } from './LabelField';
import { LabelReading } from './LabelReading';
import { readLabelColumns } from './readLabelColumns';

/**
 * Reads the US Nutrition Facts layout from recognised `text` (MM-44): serving
 * size, calories, total fat, total carbohydrate, protein, and where present
 * fiber, sodium and the micronutrients of MM-309.
 *
 * It is deliberately plain. It finds each label's first number after the
 * label, tolerating the line breaks a text recogniser inserts and the
 * look-alike characters it confuses with digits. A panel whose labels and
 * values came back in separate columns is paired in order
 * (`readLabelColumns`), and those values replace what the plain read found
 * for the same labels, which would be another line's. It never fills a field
 * it did not find, and it marks the numbers it was unsure of. The caller
 * reviews everything it returns.
 */
export function parseNutritionLabel(text: string): LabelReading {
  const t = clean(text);
  const columns = readLabelColumns(digits(t));
  const unsure = new Set<LabelField>();

  /** The column's value when the label was in a column, else the plain read; marks what is unsure. */
  const take = (field: LabelField, plain: PlainRead | undefined, unit: 'g' | 'mg' | 'kcal'): number | undefined => {
    if (columns.has(field)) {
      const column = columns.get(field);
      if (column === undefined) return undefined;
      const [value, printed] = column;
      const fits = printed === undefined || (unit !== 'kcal' && printed === unit);
      if (!fits) return undefined;
      unsure.add(field);
      return value;
    }
    if (plain === undefined) return undefined;
    if (plain.repaired) unsure.add(field);
    return plain.value;
  };

  const servingG = servingGrams(t);
  const kcal = take('kcal', numberAfter(t, String.raw`calories(?!\s*from)`), 'kcal');
  const fatG = take('fatG', numberAfter(t, String.raw`total\s*fat`), 'g');
  const carbsG = take('carbsG', numberAfter(t, String.raw`total\s*carb\w*\.?`), 'g');
  const proteinG = take('proteinG', numberAfter(t, String.raw`protein`), 'g');
  const fiberG = take('fiberG', numberAfter(t, String.raw`(?:dietary\s*)?fiber`), 'g');
  const sodiumMg = take('sodiumMg', numberAfter(t, String.raw`sodium`), 'mg');

  // What the serving's weight makes impossible: more grams of a nutrient than the serving, or more energy than pure fat.
  if (servingG !== undefined && servingG > 0) {
    for (const [field, grams] of [
      ['proteinG', proteinG],
      ['carbsG', carbsG],
      ['fatG', fatG],
      ['fiberG', fiberG],
    ] as const) {
      if (grams !== undefined && grams > servingG) unsure.add(field);
    }
    if (sodiumMg !== undefined && sodiumMg / 1000 > servingG) unsure.add('sodiumMg');
    if (kcal !== undefined && kcal > servingG * 9 + 5) unsure.add('kcal');
  }

  return new LabelReading({
    servingText: servingText(t),
    servingGrams: servingG,
    kcal,
    fatG,
    carbsG,
    proteinG,
    fiberG,
    // "Sugar Alcohol", or a single polyol by its name (21 CFR 101.9(c)(6)(iv)), only with grams; never a bare
    // "alcohol", which is ethanol, and never allulose, which is not a sugar alcohol (MM-397).
    sugarAlcoholsG: columns.has('sugarAlcoholsG')
      ? fromColumn(columns, 'sugarAlcoholsG', 'g')
      : amountAfter(
          t,
          String.raw`(?:sugar\s*alcohols?|polyols?|erythritol|xylitol|sorbitol|maltitol|mannitol|isomalt|lactitol)`,
          'g',
        ),
    sodiumMg,
    micros: new Micronutrients(
      Object.fromEntries(
        lines.map(([nutrient, label, unit]) => [
          nutrient,
          columns.has(nutrient) ? fromColumn(columns, nutrient, unit) : amountAfter(t, label, unit),
        ]),
      ),
    ),
    unsure,
  });
}

/** A number found after its label, and whether a look-alike letter was repaired in it. */
interface PlainRead {
  readonly value: number;
  readonly repaired: boolean;
}

/** A value read from a column with the unit asked for (a bare number counts), or undefined. */
function fromColumn(
  columns: ReadonlyMap<string, readonly [number, string | undefined] | undefined>,
  key: string,
  unit: 'g' | 'mg' | 'mcg',
): number | undefined {
  const column = columns.get(key);
  if (column === undefined) return undefined;
  const [value, printed] = column;
  return printed === undefined || printed === unit ? value : undefined;
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

function numberAfter(t: string, label: string): PlainRead | undefined {
  const m = new RegExp(label + String.raw`[\s:.\-]*(\d+(?:[.,]\d+)?)`).exec(digits(t));
  const found = m?.[1];
  if (m === null || found === undefined) return undefined;
  const value = tryParseDouble(found.replaceAll(',', '.'));
  if (value === undefined) return undefined;
  // The number ends the match, and the repair keeps every length, so the same span of the text is what was printed.
  const end = m.index + m[0].length;
  return { value, repaired: t.slice(end - found.length, end) !== found };
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
