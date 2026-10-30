import { Micronutrient } from '../micros/Micronutrient';
import { Micronutrients } from '../micros/Micronutrients';
import type { FoodEvidence } from '../meal/FoodEvidence';
import { isSpecificCitation } from '../meal/isSpecificCitation';
import type { FoodAnalysisReading } from './FoodAnalysisReading';
import type { FoodDraft } from './FoodDraft';
import type { FoodIngredient } from './FoodIngredient';
import { foodAnalysisFormatName, foodAnalysisFormatVersion } from './foodAnalysisFormat';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The JSON in `text`: a fenced code block that holds an object, or else the outermost braces. */
function jsonIn(text: string): string | undefined {
  for (const match of text.matchAll(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/g)) {
    const body = (match[1] ?? '').trim();
    if (body.startsWith('{')) return body;
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start < 0 || end <= start ? undefined : text.slice(start, end + 1);
}

/** Parses `json`, then again with the curly quotes and odd spaces a chat app may have put in on copy. */
function parsed(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return JSON.parse(json.replace(/[“”„‟″]/g, '"').replace(/[   ]/g, ' '));
  }
}

/** A number given as a number or as digits; anything else is not given. */
function numberOf(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

const textOf = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);

/** Kept as the assistant's when it says it verified a specific source; otherwise an estimate, to be looked up. */
function evidenceOf(source: unknown): FoodEvidence {
  const citation = isObject(source) ? textOf(source['citation']) : textOf(source);
  const verified = isObject(source) && source['verified'] === true;
  return { kind: verified && isSpecificCitation(citation) ? 'cited' : 'estimated', citation };
}

function ingredientsOf(value: unknown): FoodIngredient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((line): FoodIngredient[] => {
    const name = isObject(line) ? textOf(line['name']) : textOf(line);
    if (name === undefined) return [];
    const grams = isObject(line) ? numberOf(line['grams']) : undefined;
    return [{ name, grams }];
  });
}

function foodOf(value: unknown, at: number): FoodDraft {
  const food = isObject(value) ? value : {};
  const per100 = isObject(food['per_100g']) ? food['per_100g'] : {};
  const serving = isObject(food['serving']) ? food['serving'] : {};
  const micros: Partial<Record<Micronutrient, number>> = {};
  for (const n of Micronutrient.values) {
    const amount = numberOf(per100[Micronutrient.column(n)]);
    if (amount !== undefined) micros[n] = amount;
  }
  return {
    name: textOf(food['name']) ?? `Food ${at + 1}`,
    brand: textOf(food['brand']),
    lookup: textOf(food['lookup']),
    group: textOf(food['group']),
    servingDescription: textOf(serving['description']),
    servingGrams: numberOf(serving['grams']),
    barcode: textOf(food['barcode']),
    kcal: numberOf(per100['kcal']),
    proteinG: numberOf(per100['protein_g']),
    carbsG: numberOf(per100['carbs_g']),
    fatG: numberOf(per100['fat_g']),
    fiberG: numberOf(per100['fiber_g']),
    sugarAlcoholsG: numberOf(per100['sugar_alcohols_g']),
    alcoholG: numberOf(per100['alcohol_g']),
    micros: new Micronutrients(micros),
    ingredients: ingredientsOf(food['ingredients']),
    evidence: evidenceOf(food['source']),
    keep: true,
  };
}

/**
 * The foods in an answer pasted from the person's assistant (MM-709), as
 * `parseMealAnalysis` reads a meal: the JSON is found wherever it is, so
 * the assistant's sentences around it do no harm. What is wrong with a
 * food is not decided here: it is read as given and `foodDraftProblems`
 * says what it lacks.
 */
export function parseFoodAnalysis(text: string): FoodAnalysisReading {
  const json = jsonIn(text);
  if (json === undefined) {
    return { kind: 'unreadable', reason: 'There is no food in this text. Paste the whole answer, with its code block.' };
  }
  let value: unknown;
  try {
    value = parsed(json);
  } catch {
    return {
      kind: 'unreadable',
      reason: 'The code block is not complete JSON; part of it may not have been copied. Copy the whole code block again.',
    };
  }
  if (isObject(value) && value['format'] !== undefined && value['format'] !== foodAnalysisFormatName) {
    return { kind: 'unreadable', reason: `This answer is in another format (“${String(value['format'])}”).` };
  }
  const listed: unknown = isObject(value) ? value['foods'] : undefined;
  if (!isObject(value) || !Array.isArray(listed)) {
    return { kind: 'unreadable', reason: 'This is not a food in the app’s format: it has no list of foods.' };
  }
  const version = numberOf(value['version']);
  if (version !== undefined && version !== foodAnalysisFormatVersion) {
    return { kind: 'unreadable', reason: `This answer is in version ${version} of the format; the app reads version ${foodAnalysisFormatVersion}.` };
  }
  const foods = (listed as unknown[]).map((food, at) => foodOf(food, at));
  if (foods.length === 0) return { kind: 'unreadable', reason: 'The answer has no foods in it.' };
  return { kind: 'read', foods };
}
